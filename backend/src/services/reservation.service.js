const mongoose = require("mongoose");

const { Reservation, Room } = require("../models");
const ApiError = require("../utils/ApiError");

const ACTIVE_RESERVATION_STATUSES = ["pending", "confirmed", "checked_in"];
const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled", "checked_in"];

const calculateReservedEndTime = (reservedStartTime, expectedDuration) =>
  new Date(new Date(reservedStartTime).getTime() + expectedDuration * 60 * 1000);

const hasReservationConflict = ({ existingStartTime, existingEndTime, requestedStartTime, requestedEndTime }) =>
  existingStartTime < requestedEndTime && existingEndTime > requestedStartTime;

const normalizeReservationPayload = (payload) => {
  const normalizedPayload = { ...payload };

  if (typeof normalizedPayload.customerName === "string") {
    normalizedPayload.customerName = normalizedPayload.customerName.trim();
  }

  if (typeof normalizedPayload.customerPhone === "string") {
    normalizedPayload.customerPhone = normalizedPayload.customerPhone.trim();
  }

  if (typeof normalizedPayload.status === "string") {
    normalizedPayload.status = normalizedPayload.status.trim().toLowerCase();
  }

  if (typeof normalizedPayload.notes === "string") {
    normalizedPayload.notes = normalizedPayload.notes.trim();
  }

  if (normalizedPayload.reservedStartTime) {
    normalizedPayload.reservedStartTime = new Date(normalizedPayload.reservedStartTime);
  }

  return normalizedPayload;
};

const buildReservationResponse = (reservation) => ({
  id: reservation._id,
  customerName: reservation.customerName,
  customerPhone: reservation.customerPhone,
  roomId: reservation.roomId,
  reservedStartTime: reservation.reservedStartTime,
  expectedDuration: reservation.expectedDuration,
  reservedEndTime: calculateReservedEndTime(reservation.reservedStartTime, reservation.expectedDuration),
  depositAmount: reservation.depositAmount,
  status: reservation.status,
  notes: reservation.notes,
  roomSnapshot: reservation.roomSnapshot,
  reservedBy: reservation.reservedBy,
  checkedInAt: reservation.checkedInAt,
  createdAt: reservation.createdAt,
  updatedAt: reservation.updatedAt
});

const assertRoomBookable = (room) => {
  if (!room || !room.isActive) {
    throw new ApiError(404, "Room not found", "ROOM_NOT_FOUND");
  }

  if (room.status === "maintenance" || room.status === "cleaning") {
    throw new ApiError(400, "Room is not bookable in its current state", "ROOM_NOT_BOOKABLE");
  }
};

const buildRoomSnapshot = (room) => ({
  roomId: room._id,
  code: room.code,
  name: room.name,
  type: room.type,
  hourlyRate: room.hourlyRate
});

const loadActiveReservationsForRoom = async (roomId, excludeReservationId = null) => {
  const query = {
    roomId,
    status: { $in: ACTIVE_RESERVATION_STATUSES }
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  return Reservation.find(query).sort({ reservedStartTime: 1 });
};

const assertNoRoomBookingConflict = async ({
  roomId,
  reservedStartTime,
  expectedDuration,
  excludeReservationId = null
}) => {
  const requestedEndTime = calculateReservedEndTime(reservedStartTime, expectedDuration);
  const reservations = await loadActiveReservationsForRoom(roomId, excludeReservationId);

  const conflict = reservations.find((reservation) => {
    const existingEndTime = calculateReservedEndTime(reservation.reservedStartTime, reservation.expectedDuration);

    return hasReservationConflict({
      existingStartTime: reservation.reservedStartTime,
      existingEndTime,
      requestedStartTime: reservedStartTime,
      requestedEndTime
    });
  });

  if (conflict) {
    throw new ApiError(409, "Room is already booked for the requested time", "ROOM_DOUBLE_BOOKING");
  }
};

const isReservationCurrentlyActive = (reservation, now = new Date()) => {
  if (!ACTIVE_RESERVATION_STATUSES.includes(reservation.status)) {
    return false;
  }

  const start = new Date(reservation.reservedStartTime);
  const end = calculateReservedEndTime(start, reservation.expectedDuration);

  return start <= now && end > now;
};

const syncRoomForReservation = async (reservation, room, now = new Date()) => {
  const shouldLinkReservation = reservation.status === "checked_in" || isReservationCurrentlyActive(reservation, now);

  if (shouldLinkReservation && room.status !== "occupied") {
    room.status = "reserved";
    room.activeReservationId = reservation._id;
  } else if (
    room.activeReservationId &&
    room.activeReservationId.toString() === reservation._id.toString() &&
    room.status !== "occupied"
  ) {
    room.status = "available";
    room.activeReservationId = null;
  }

  await room.save();
};

const listReservations = async (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status.trim().toLowerCase();
  }

  if (query.roomId && mongoose.Types.ObjectId.isValid(query.roomId)) {
    filter.roomId = query.roomId;
  }

  const reservations = await Reservation.find(filter).sort({ reservedStartTime: 1 });

  return {
    reservations: reservations.map(buildReservationResponse),
    total: reservations.length
  };
};

const getReservationById = async (reservationId) => {
  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    throw new ApiError(404, "Reservation not found", "RESERVATION_NOT_FOUND");
  }

  return buildReservationResponse(reservation);
};

const createReservation = async (payload, userId = null) => {
  const normalizedPayload = normalizeReservationPayload(payload);
  const room = await Room.findById(normalizedPayload.roomId);

  assertRoomBookable(room);

  await assertNoRoomBookingConflict({
    roomId: normalizedPayload.roomId,
    reservedStartTime: normalizedPayload.reservedStartTime,
    expectedDuration: normalizedPayload.expectedDuration
  });

  const reservation = await Reservation.create({
    customerName: normalizedPayload.customerName,
    customerPhone: normalizedPayload.customerPhone,
    roomId: normalizedPayload.roomId,
    reservedStartTime: normalizedPayload.reservedStartTime,
    expectedDuration: normalizedPayload.expectedDuration,
    depositAmount: normalizedPayload.depositAmount || 0,
    status: normalizedPayload.status || "pending",
    notes: normalizedPayload.notes || "",
    roomSnapshot: buildRoomSnapshot(room),
    reservedBy: userId
  });

  await syncRoomForReservation(reservation, room);

  return buildReservationResponse(reservation);
};

const updateReservation = async (reservationId, payload) => {
  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    throw new ApiError(404, "Reservation not found", "RESERVATION_NOT_FOUND");
  }

  if (reservation.status === "cancelled") {
    throw new ApiError(400, "Cancelled reservations cannot be updated", "RESERVATION_NOT_EDITABLE");
  }

  if (reservation.status === "checked_in") {
    throw new ApiError(400, "Checked-in reservations cannot be updated", "RESERVATION_NOT_EDITABLE");
  }

  const normalizedPayload = normalizeReservationPayload(payload);

  if (normalizedPayload.status === "cancelled" || normalizedPayload.status === "checked_in") {
    throw new ApiError(
      400,
      "Use the dedicated cancel or check-in endpoint for this status change",
      "RESERVATION_STATUS_CHANGE_NOT_ALLOWED"
    );
  }

  const nextRoomId = normalizedPayload.roomId || reservation.roomId;
  const room = await Room.findById(nextRoomId);

  assertRoomBookable(room);

  const nextStartTime = normalizedPayload.reservedStartTime || reservation.reservedStartTime;
  const nextDuration = normalizedPayload.expectedDuration || reservation.expectedDuration;

  await assertNoRoomBookingConflict({
    roomId: nextRoomId,
    reservedStartTime: nextStartTime,
    expectedDuration: nextDuration,
    excludeReservationId: reservation._id
  });

  const previousRoomId = reservation.roomId.toString();

  reservation.customerName = normalizedPayload.customerName || reservation.customerName;
  reservation.customerPhone = normalizedPayload.customerPhone || reservation.customerPhone;
  reservation.roomId = nextRoomId;
  reservation.reservedStartTime = nextStartTime;
  reservation.expectedDuration = nextDuration;
  reservation.depositAmount =
    normalizedPayload.depositAmount !== undefined ? normalizedPayload.depositAmount : reservation.depositAmount;
  reservation.status = normalizedPayload.status || reservation.status;
  reservation.notes = normalizedPayload.notes !== undefined ? normalizedPayload.notes : reservation.notes;
  reservation.roomSnapshot = buildRoomSnapshot(room);

  await reservation.save();

  if (previousRoomId !== nextRoomId.toString()) {
    const previousRoom = await Room.findById(previousRoomId);

    if (previousRoom) {
      await syncRoomForReservation({ ...reservation.toObject(), _id: reservation._id, status: "cancelled" }, previousRoom);
    }
  }

  await syncRoomForReservation(reservation, room);

  return buildReservationResponse(reservation);
};

const cancelReservation = async (reservationId) => {
  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    throw new ApiError(404, "Reservation not found", "RESERVATION_NOT_FOUND");
  }

  if (reservation.status === "cancelled") {
    throw new ApiError(400, "Reservation is already cancelled", "RESERVATION_ALREADY_CANCELLED");
  }

  if (reservation.status === "checked_in") {
    throw new ApiError(400, "Checked-in reservations cannot be cancelled", "RESERVATION_NOT_CANCELLABLE");
  }

  reservation.status = "cancelled";
  await reservation.save();

  const room = await Room.findById(reservation.roomId);

  if (room) {
    await syncRoomForReservation(reservation, room);
  }

  return buildReservationResponse(reservation);
};

const checkInReservation = async (reservationId) => {
  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    throw new ApiError(404, "Reservation not found", "RESERVATION_NOT_FOUND");
  }

  if (reservation.status === "cancelled") {
    throw new ApiError(400, "Cancelled reservations cannot be checked in", "RESERVATION_NOT_CHECKINABLE");
  }

  if (reservation.status === "checked_in") {
    throw new ApiError(400, "Reservation is already checked in", "RESERVATION_ALREADY_CHECKED_IN");
  }

  const room = await Room.findById(reservation.roomId);

  assertRoomBookable(room);

  if (room.currentSessionId) {
    throw new ApiError(409, "Room already has an active session", "ROOM_ALREADY_OCCUPIED");
  }

  reservation.status = "checked_in";
  reservation.checkedInAt = new Date();
  await reservation.save();

  await syncRoomForReservation(reservation, room, reservation.checkedInAt);

  return {
    reservation: buildReservationResponse(reservation),
    sessionDraft: {
      reservationId: reservation._id,
      roomId: reservation.roomId,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      roomSnapshot: reservation.roomSnapshot,
      openedAt: reservation.checkedInAt
    }
  };
};

module.exports = {
  ACTIVE_RESERVATION_STATUSES,
  RESERVATION_STATUSES,
  calculateReservedEndTime,
  hasReservationConflict,
  isReservationCurrentlyActive,
  normalizeReservationPayload,
  listReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
  checkInReservation,
  assertNoRoomBookingConflict,
  syncRoomForReservation
};
