const mongoose = require("mongoose");

const PAYMENT_METHODS = ["cash", "card", "qr"];
const PAYMENT_STATUSES = ["unpaid", "paid"];

const checkoutValidator = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(req.params.sessionId)) {
    errors.push({ field: "sessionId", message: "sessionId must be a valid ObjectId" });
  }

  if (body.paymentStatus !== undefined) {
    if (typeof body.paymentStatus !== "string" || !PAYMENT_STATUSES.includes(body.paymentStatus.trim().toLowerCase())) {
      errors.push({ field: "paymentStatus", message: "paymentStatus must be one of: unpaid, paid" });
    }
  }

  if (body.paymentMethod !== undefined && body.paymentMethod !== null) {
    if (typeof body.paymentMethod !== "string" || !PAYMENT_METHODS.includes(body.paymentMethod.trim().toLowerCase())) {
      errors.push({ field: "paymentMethod", message: "paymentMethod must be one of: cash, card, qr" });
    }
  }

  if (body.discountAmount !== undefined && (typeof body.discountAmount !== "number" || Number.isNaN(body.discountAmount) || body.discountAmount < 0)) {
    errors.push({ field: "discountAmount", message: "discountAmount must be a non-negative number" });
  }

  if (body.taxAmount !== undefined && (typeof body.taxAmount !== "number" || Number.isNaN(body.taxAmount) || body.taxAmount < 0)) {
    errors.push({ field: "taxAmount", message: "taxAmount must be a non-negative number" });
  }

  if (body.checkoutTime !== undefined) {
    const date = new Date(body.checkoutTime);

    if (Number.isNaN(date.getTime())) {
      errors.push({ field: "checkoutTime", message: "checkoutTime must be a valid datetime" });
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

const invoiceIdParamValidator = (req) => {
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  checkoutValidator,
  invoiceIdParamValidator
};
