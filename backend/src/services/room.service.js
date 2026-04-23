const mongoose = require("mongoose");

const { Room } = require("../models");
const ApiError = require("../utils/ApiError");

const ROOM_STATUSES = ["available", "reserved", "occupied", "cleaning", "maintenance"];
const ROOM_TYPES = ["standard", "vip"];

const ALLOWED_STATUS_TRANSITIONS = {
  available: ["reserved", "occupied", "maintenance"],
  reserved: ["available", "occupied", "maintenance"],
  occupied: ["cleaning", "maintenance"],
  cleaning: ["available", "maintenance"],
  maintenance: ["available"]
};

const isObjectIdLike = (value) => value === null || value === undefined || mongoose.Types.ObjectId.isValid(value);

const normalizeString = (value) => (typeof value === "string" ? value.trim() : value);

const normalizeRoomPayload = (payload) => {
  const normalizedPayload = { ...payload };

  if (typeof normalizedPayload.code === "string") {
    normalizedPayload.code = normalizedPayload.code.trim().toUpperCase();
  }

  if (typeof normalizedPayload.name === "string") {
    normalizedPayload.name = normalizedPayload.name.trim();
  }

  if (typeof normalizedPayload.type === "string") {
    normalizedPayload.type = normalizedPayload.type.trim().toLowerCase();
  }

  if (typeof normalizedPayload.status === "string") {
    normalizedPayload.status = normalizedPayload.status.trim().toLowerCase();
  }

  if (typeof normalizedPayload.notes === "string") {
    normalizedPayload.notes = normalizedPayload.notes.trim();
  }

  if ("currentSessionId" in normalizedPayload) {
    normalizedPayload.currentSessionId = normalizedPayload.currentSessionId || null;
  }

  if ("activeReservationId" in normalizedPayload) {
    normalizedPayload.activeReservationId = normalizedPayload.activeReservationId || null;
  }

  return normalizedPayload;
};

const assertValidStatusTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Invalid room status transition from ${currentStatus} to ${nextStatus}`,
      "INVALID_ROOM_STATUS_TRANSITION"
    );
  }
};

const applyRoomStateInvariants = (payload, currentRoom = null) => {
  const nextState = {
    ...payload
  };

  const effectiveStatus = nextState.status || currentRoom?.status || "available";
  const effectiveCurrentSessionId =
    "currentSessionId" in nextState ? nextState.currentSessionId : currentRoom?.currentSessionId || null;
  const effectiveActiveReservationId =
    "activeReservationId" in nextState ? nextState.activeReservationId : currentRoom?.activeReservationId || null;

  if (!ROOM_STATUSES.includes(effectiveStatus)) {
    throw new ApiError(400, "Invalid room status", "INVALID_ROOM_STATUS");
  }

  if (!isObjectIdLike(effectiveCurrentSessionId)) {
    throw new ApiError(400, "currentSessionId must be a valid ObjectId or null", "INVALID_CURRENT_SESSION_ID");
  }

  if (!isObjectIdLike(effectiveActiveReservationId)) {
    throw new ApiError(
      400,
      "activeReservationId must be a valid ObjectId or null",
      "INVALID_ACTIVE_RESERVATION_ID"
    );
  }

  if (effectiveStatus === "available") {
    nextState.currentSessionId = null;
    nextState.activeReservationId = null;
  }

  if (effectiveStatus === "occupied") {
    if (!effectiveCurrentSessionId) {
      throw new ApiError(400, "occupied rooms must include currentSessionId", "CURRENT_SESSION_REQUIRED");
    }

    nextState.currentSessionId = effectiveCurrentSessionId;
    nextState.activeReservationId = effectiveActiveReservationId;
  }

  if (effectiveStatus === "reserved") {
    if (!effectiveActiveReservationId) {
      throw new ApiError(400, "reserved rooms must include activeReservationId", "ACTIVE_RESERVATION_REQUIRED");
    }

    nextState.currentSessionId = null;
    nextState.activeReservationId = effectiveActiveReservationId;
  }

  if (effectiveStatus === "cleaning" || effectiveStatus === "maintenance") {
    nextState.currentSessionId = null;
    nextState.activeReservationId = null;
  }

  return nextState;
};

const toRoomResponse = (room) => ({
  id: room._id,
  code: room.code,
  name: room.name,
  type: room.type,
  capacity: room.capacity,
  status: room.status,
  hourlyRate: room.hourlyRate,
  isActive: room.isActive,
  notes: room.notes,
  currentSessionId: room.currentSessionId,
  activeReservationId: room.activeReservationId,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt
});

const buildListFilter = (query) => {
  const filter = {};

  if (query.status) {
    filter.status = normalizeString(query.status).toLowerCase();
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  return filter;
};

const listRooms = async (query) => {
  const rooms = await Room.find(buildListFilter(query)).sort({ code: 1 });

  return {
    rooms: rooms.map(toRoomResponse),
    total: rooms.length
  };
};

const getRoomById = async (roomId) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw new ApiError(404, "Room not found", "ROOM_NOT_FOUND");
  }

  return toRoomResponse(room);
};

const createRoom = async (payload) => {
  const normalizedPayload = normalizeRoomPayload(payload);
  const roomPayload = applyRoomStateInvariants(normalizedPayload);

  const room = await Room.create(roomPayload);

  return toRoomResponse(room);
};

const updateRoom = async (roomId, payload) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw new ApiError(404, "Room not found", "ROOM_NOT_FOUND");
  }

  const normalizedPayload = normalizeRoomPayload(payload);
  const nextStatus = normalizedPayload.status || room.status;

  assertValidStatusTransition(room.status, nextStatus);

  const roomPayload = applyRoomStateInvariants(normalizedPayload, room);

  Object.assign(room, roomPayload);
  await room.save();

  return toRoomResponse(room);
};

const updateRoomStatus = async (roomId, payload) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw new ApiError(404, "Room not found", "ROOM_NOT_FOUND");
  }

  const normalizedPayload = normalizeRoomPayload(payload);
  const nextStatus = normalizedPayload.status;

  assertValidStatusTransition(room.status, nextStatus);

  const roomPayload = applyRoomStateInvariants(normalizedPayload, room);

  room.status = roomPayload.status;
  room.currentSessionId = roomPayload.currentSessionId;
  room.activeReservationId = roomPayload.activeReservationId;

  if (typeof roomPayload.notes === "string") {
    room.notes = roomPayload.notes;
  }

  await room.save();

  return toRoomResponse(room);
};

module.exports = {
  ROOM_STATUSES,
  ROOM_TYPES,
  ALLOWED_STATUS_TRANSITIONS,
  normalizeRoomPayload,
  assertValidStatusTransition,
  applyRoomStateInvariants,
  listRooms,
  getRoomById,
  createRoom,
  updateRoom,
  updateRoomStatus
};
