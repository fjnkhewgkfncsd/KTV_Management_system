const mongoose = require("mongoose");

const { Reservation, Room, Session } = require("../models");
const ApiError = require("../utils/ApiError");
const productService = require("./product.service");

const ACTIVE_SESSION_STATUSES = ["open"];

const buildRoomRateSnapshot = (room) => ({
  roomId: room._id,
  code: room.code,
  name: room.name,
  type: room.type,
  hourlyRate: room.hourlyRate
});

const normalizeSessionPayload = (payload) => {
  const normalizedPayload = { ...payload };

  if (typeof normalizedPayload.customerName === "string") {
    normalizedPayload.customerName = normalizedPayload.customerName.trim();
  }

  if (typeof normalizedPayload.customerPhone === "string") {
    normalizedPayload.customerPhone = normalizedPayload.customerPhone.trim();
  }

  if (typeof normalizedPayload.notes === "string") {
    normalizedPayload.notes = normalizedPayload.notes.trim();
  }

  if (normalizedPayload.startTime) {
    normalizedPayload.startTime = new Date(normalizedPayload.startTime);
  }

  return normalizedPayload;
};

const assertRoomCanStartSession = ({ room, existingActiveSession = null }) => {
  if (!room || !room.isActive) {
    throw new ApiError(404, "Room not found", "ROOM_NOT_FOUND");
  }

  if (room.status === "maintenance" || room.status === "cleaning") {
    throw new ApiError(400, "Room is not available for session start", "ROOM_NOT_AVAILABLE");
  }

  if (room.currentSessionId || existingActiveSession) {
    throw new ApiError(409, "Room already has an active session", "ACTIVE_SESSION_CONFLICT");
  }
};

const syncRoomForSessionStart = async ({ room, session }) => {
  room.status = "occupied";
  room.currentSessionId = session._id;

  if (session.reservationId) {
    room.activeReservationId = session.reservationId;
  } else {
    room.activeReservationId = null;
  }

  await room.save();
};

const syncRoomForSessionClose = async ({ room, session }) => {
  if (room.currentSessionId && room.currentSessionId.toString() === session._id.toString()) {
    room.currentSessionId = null;
  }

  if (session.reservationId && room.activeReservationId && room.activeReservationId.toString() === session.reservationId.toString()) {
    room.activeReservationId = null;
  }

  room.status = "available";
  await room.save();
};

const buildSessionResponse = (session) => ({
  id: session._id,
  roomId: session.roomId,
  reservationId: session.reservationId,
  customerName: session.customerName,
  customerPhone: session.customerPhone,
  startTime: session.startTime,
  endTime: session.endTime,
  roomRateSnapshot: session.roomRateSnapshot,
  orderedItems: session.orderedItems,
  itemsSubtotal: session.itemsSubtotal || 0,
  totalAmount: session.totalAmount || 0,
  status: session.status,
  notes: session.notes,
  openedBy: session.openedBy,
  closedBy: session.closedBy,
  invoiceId: session.invoiceId,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt
});

const recalculateSessionTotals = (session) => {
  const itemsSubtotal = (session.orderedItems || []).reduce((sum, item) => sum + item.lineTotal, 0);

  session.itemsSubtotal = itemsSubtotal;
  session.totalAmount = itemsSubtotal;

  return session;
};

const findActiveSessionForRoom = async (roomId) => Session.findOne({ roomId, status: { $in: ACTIVE_SESSION_STATUSES } });

const createWalkInSession = async (payload, userId) => {
  const normalizedPayload = normalizeSessionPayload(payload);
  const room = await Room.findById(normalizedPayload.roomId);
  const existingActiveSession = await findActiveSessionForRoom(normalizedPayload.roomId);

  assertRoomCanStartSession({ room, existingActiveSession });

  const session = await Session.create({
    roomId: room._id,
    reservationId: null,
    customerName: normalizedPayload.customerName,
    customerPhone: normalizedPayload.customerPhone || "",
    startTime: normalizedPayload.startTime || new Date(),
    endTime: null,
    roomRateSnapshot: buildRoomRateSnapshot(room),
    orderedItems: [],
    status: "open",
    notes: normalizedPayload.notes || "",
    openedBy: userId
  });

  await syncRoomForSessionStart({ room, session });

  return buildSessionResponse(session);
};

const createSessionFromReservation = async (reservationId, userId) => {
  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    throw new ApiError(404, "Reservation not found", "RESERVATION_NOT_FOUND");
  }

  if (reservation.status !== "checked_in") {
    throw new ApiError(
      400,
      "Reservation must be checked in before creating a session",
      "RESERVATION_NOT_READY_FOR_SESSION"
    );
  }

  const existingReservationSession = await Session.findOne({ reservationId });

  if (existingReservationSession) {
    throw new ApiError(409, "A session already exists for this reservation", "SESSION_ALREADY_EXISTS");
  }

  const room = await Room.findById(reservation.roomId);
  const existingActiveSession = await findActiveSessionForRoom(reservation.roomId);

  assertRoomCanStartSession({ room, existingActiveSession });

  const session = await Session.create({
    roomId: reservation.roomId,
    reservationId: reservation._id,
    customerName: reservation.customerName,
    customerPhone: reservation.customerPhone,
    startTime: reservation.checkedInAt || new Date(),
    endTime: null,
    roomRateSnapshot: reservation.roomSnapshot,
    orderedItems: [],
    status: "open",
    notes: reservation.notes || "",
    openedBy: userId
  });

  await syncRoomForSessionStart({ room, session });

  return buildSessionResponse(session);
};

const listActiveSessions = async () => {
  const sessions = await Session.find({ status: "open" }).sort({ startTime: 1 });

  return {
    sessions: sessions.map(buildSessionResponse),
    total: sessions.length
  };
};

const getSessionById = async (sessionId) => {
  const session = await Session.findById(sessionId);

  if (!session) {
    throw new ApiError(404, "Session not found", "SESSION_NOT_FOUND");
  }

  return buildSessionResponse(session);
};

const addItemsToSession = async (sessionId, payload, userId) => {
  const session = await Session.findById(sessionId);

  if (!session) {
    throw new ApiError(404, "Session not found", "SESSION_NOT_FOUND");
  }

  if (session.status !== "open") {
    throw new ApiError(400, "Only active sessions can receive ordered items", "SESSION_NOT_EDITABLE");
  }

  const requestedItems = payload.items || [];

  const productDocuments = await Promise.all(
    requestedItems.map((item) => productService.getProductDocumentOrThrow(item.productId))
  );

  requestedItems.forEach((item, index) => {
    const product = productDocuments[index];

    if (!product.isActive) {
      throw new ApiError(400, `Product is inactive: ${product.name}`, "PRODUCT_INACTIVE");
    }

    if (product.stockQty < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for product: ${product.name}`,
        "INSUFFICIENT_STOCK"
      );
    }
  });

  const newOrderedItems = [];

  for (let index = 0; index < requestedItems.length; index += 1) {
    const item = requestedItems[index];
    const product = productDocuments[index];
    const unitPrice = product.price;
    const lineTotal = unitPrice * item.quantity;

    await productService.applyStockMovement({
      product,
      movementType: "sale",
      quantity: item.quantity,
      reason: `Session sale: ${session._id.toString()}`,
      createdBy: userId
    });

    newOrderedItems.push({
      productId: product._id,
      productName: product.name,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
      addedAt: new Date()
    });
  }

  session.orderedItems.push(...newOrderedItems);
  recalculateSessionTotals(session);
  await session.save();

  return buildSessionResponse(session);
};

const closeSession = async (sessionId, userId) => {
  void sessionId;
  void userId;

  throw new ApiError(
    400,
    "Use the checkout endpoint to close a session and generate its invoice",
    "SESSION_CLOSE_REQUIRES_CHECKOUT"
  );
};

module.exports = {
  ACTIVE_SESSION_STATUSES,
  buildRoomRateSnapshot,
  normalizeSessionPayload,
  assertRoomCanStartSession,
  syncRoomForSessionStart,
  syncRoomForSessionClose,
  recalculateSessionTotals,
  createWalkInSession,
  createSessionFromReservation,
  listActiveSessions,
  getSessionById,
  addItemsToSession,
  closeSession
};
