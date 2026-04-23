const mongoose = require("mongoose");

const ROOM_STATUSES = ["available", "reserved", "occupied", "cleaning", "maintenance"];
const ROOM_TYPES = ["standard", "vip"];

const isValidObjectId = (value) => value === undefined || value === null || mongoose.Types.ObjectId.isValid(value);

const validateRoomPayload = (payload, { partial = false } = {}) => {
  const errors = [];

  if (!partial || "code" in payload) {
    if (typeof payload.code !== "string" || payload.code.trim().length < 1 || payload.code.trim().length > 20) {
      errors.push({ field: "code", message: "code is required and must be 1 to 20 characters" });
    }
  }

  if (!partial || "name" in payload) {
    if (typeof payload.name !== "string" || payload.name.trim().length < 1 || payload.name.trim().length > 100) {
      errors.push({ field: "name", message: "name is required and must be 1 to 100 characters" });
    }
  }

  if (!partial || "type" in payload) {
    if (typeof payload.type !== "string" || !ROOM_TYPES.includes(payload.type.trim().toLowerCase())) {
      errors.push({ field: "type", message: "type must be one of: standard, vip" });
    }
  }

  if (!partial || "capacity" in payload) {
    if (!Number.isInteger(payload.capacity) || payload.capacity < 1 || payload.capacity > 100) {
      errors.push({ field: "capacity", message: "capacity must be an integer between 1 and 100" });
    }
  }

  if (!partial || "hourlyRate" in payload) {
    if (typeof payload.hourlyRate !== "number" || Number.isNaN(payload.hourlyRate) || payload.hourlyRate < 0) {
      errors.push({ field: "hourlyRate", message: "hourlyRate must be a number greater than or equal to 0" });
    }
  }

  if ("status" in payload) {
    if (typeof payload.status !== "string" || !ROOM_STATUSES.includes(payload.status.trim().toLowerCase())) {
      errors.push({
        field: "status",
        message: "status must be one of: available, reserved, occupied, cleaning, maintenance"
      });
    }
  }

  if ("isActive" in payload && typeof payload.isActive !== "boolean") {
    errors.push({ field: "isActive", message: "isActive must be a boolean" });
  }

  if ("notes" in payload && (typeof payload.notes !== "string" || payload.notes.length > 500)) {
    errors.push({ field: "notes", message: "notes must be a string with a maximum length of 500" });
  }

  if ("currentSessionId" in payload && !isValidObjectId(payload.currentSessionId)) {
    errors.push({ field: "currentSessionId", message: "currentSessionId must be a valid ObjectId or null" });
  }

  if ("activeReservationId" in payload && !isValidObjectId(payload.activeReservationId)) {
    errors.push({
      field: "activeReservationId",
      message: "activeReservationId must be a valid ObjectId or null"
    });
  }

  return errors;
};

const roomIdParamValidator = (req) => {
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const roomListQueryValidator = (req) => {
  const errors = [];
  const { status, isActive } = req.query || {};

  if (status !== undefined && (typeof status !== "string" || !ROOM_STATUSES.includes(status.trim().toLowerCase()))) {
    errors.push({
      field: "status",
      message: "status must be one of: available, reserved, occupied, cleaning, maintenance"
    });
  }

  if (isActive !== undefined && !["true", "false"].includes(isActive)) {
    errors.push({ field: "isActive", message: "isActive must be true or false" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const createRoomValidator = (req) => {
  const errors = validateRoomPayload(req.body || {});

  return {
    valid: errors.length === 0,
    errors
  };
};

const updateRoomValidator = (req) => {
  const errors = [...validateRoomPayload(req.body || {}, { partial: true })];

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const updateRoomStatusValidator = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  if (typeof body.status !== "string" || !ROOM_STATUSES.includes(body.status.trim().toLowerCase())) {
    errors.push({
      field: "status",
      message: "status must be one of: available, reserved, occupied, cleaning, maintenance"
    });
  }

  if ("currentSessionId" in body && !isValidObjectId(body.currentSessionId)) {
    errors.push({ field: "currentSessionId", message: "currentSessionId must be a valid ObjectId or null" });
  }

  if ("activeReservationId" in body && !isValidObjectId(body.activeReservationId)) {
    errors.push({
      field: "activeReservationId",
      message: "activeReservationId must be a valid ObjectId or null"
    });
  }

  if ("notes" in body && (typeof body.notes !== "string" || body.notes.length > 500)) {
    errors.push({ field: "notes", message: "notes must be a string with a maximum length of 500" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  createRoomValidator,
  roomIdParamValidator,
  roomListQueryValidator,
  updateRoomStatusValidator,
  updateRoomValidator
};
