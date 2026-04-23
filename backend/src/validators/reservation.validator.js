const mongoose = require("mongoose");

const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled", "checked_in"];

const validateReservationPayload = (payload, { partial = false } = {}) => {
  const errors = [];

  if (!partial || "customerName" in payload) {
    if (
      typeof payload.customerName !== "string" ||
      payload.customerName.trim().length < 1 ||
      payload.customerName.trim().length > 100
    ) {
      errors.push({ field: "customerName", message: "customerName is required and must be 1 to 100 characters" });
    }
  }

  if (!partial || "customerPhone" in payload) {
    if (
      typeof payload.customerPhone !== "string" ||
      payload.customerPhone.trim().length < 3 ||
      payload.customerPhone.trim().length > 20
    ) {
      errors.push({ field: "customerPhone", message: "customerPhone is required and must be 3 to 20 characters" });
    }
  }

  if (!partial || "roomId" in payload) {
    if (!mongoose.Types.ObjectId.isValid(payload.roomId)) {
      errors.push({ field: "roomId", message: "roomId must be a valid ObjectId" });
    }
  }

  if (!partial || "reservedStartTime" in payload) {
    const date = new Date(payload.reservedStartTime);

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      errors.push({ field: "reservedStartTime", message: "reservedStartTime must be a valid datetime" });
    }
  }

  if (!partial || "expectedDuration" in payload) {
    if (!Number.isInteger(payload.expectedDuration) || payload.expectedDuration < 1) {
      errors.push({
        field: "expectedDuration",
        message: "expectedDuration must be a positive integer number of minutes"
      });
    }
  }

  if ("depositAmount" in payload) {
    if (typeof payload.depositAmount !== "number" || Number.isNaN(payload.depositAmount) || payload.depositAmount < 0) {
      errors.push({ field: "depositAmount", message: "depositAmount must be a number greater than or equal to 0" });
    }
  }

  if ("status" in payload) {
    if (typeof payload.status !== "string" || !RESERVATION_STATUSES.includes(payload.status.trim().toLowerCase())) {
      errors.push({
        field: "status",
        message: "status must be one of: pending, confirmed, cancelled, checked_in"
      });
    }
  }

  if ("notes" in payload && (typeof payload.notes !== "string" || payload.notes.length > 500)) {
    errors.push({ field: "notes", message: "notes must be a string with a maximum length of 500" });
  }

  return errors;
};

const reservationIdParamValidator = (req) => {
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const reservationListQueryValidator = (req) => {
  const errors = [];
  const { status, roomId } = req.query || {};

  if (status !== undefined && (typeof status !== "string" || !RESERVATION_STATUSES.includes(status.trim().toLowerCase()))) {
    errors.push({
      field: "status",
      message: "status must be one of: pending, confirmed, cancelled, checked_in"
    });
  }

  if (roomId !== undefined && !mongoose.Types.ObjectId.isValid(roomId)) {
    errors.push({ field: "roomId", message: "roomId must be a valid ObjectId" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const createReservationValidator = (req) => {
  const errors = validateReservationPayload(req.body || {});

  return {
    valid: errors.length === 0,
    errors
  };
};

const updateReservationValidator = (req) => {
  const errors = [...validateReservationPayload(req.body || {}, { partial: true })];

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  createReservationValidator,
  reservationIdParamValidator,
  reservationListQueryValidator,
  updateReservationValidator
};
