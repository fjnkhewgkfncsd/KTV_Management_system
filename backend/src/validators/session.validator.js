const mongoose = require("mongoose");

const createWalkInSessionValidator = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(body.roomId)) {
    errors.push({ field: "roomId", message: "roomId must be a valid ObjectId" });
  }

  if (typeof body.customerName !== "string" || body.customerName.trim().length < 1 || body.customerName.trim().length > 100) {
    errors.push({ field: "customerName", message: "customerName is required and must be 1 to 100 characters" });
  }

  if (
    body.customerPhone !== undefined &&
    (typeof body.customerPhone !== "string" || body.customerPhone.trim().length > 20)
  ) {
    errors.push({ field: "customerPhone", message: "customerPhone must be a string up to 20 characters" });
  }

  if (body.startTime !== undefined) {
    const date = new Date(body.startTime);

    if (Number.isNaN(date.getTime())) {
      errors.push({ field: "startTime", message: "startTime must be a valid datetime" });
    }
  }

  if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 500)) {
    errors.push({ field: "notes", message: "notes must be a string with a maximum length of 500" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const addSessionItemsValidator = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  if (!Array.isArray(body.items) || body.items.length < 1) {
    errors.push({ field: "items", message: "items must be a non-empty array" });
  } else {
    body.items.forEach((item, index) => {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        errors.push({ field: `items[${index}].productId`, message: "productId must be a valid ObjectId" });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        errors.push({ field: `items[${index}].quantity`, message: "quantity must be a positive integer" });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const sessionIdParamValidator = (req) => {
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const reservationSessionParamValidator = (req) => {
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(req.params.reservationId)) {
    errors.push({ field: "reservationId", message: "reservationId must be a valid ObjectId" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  addSessionItemsValidator,
  createWalkInSessionValidator,
  sessionIdParamValidator,
  reservationSessionParamValidator
};
