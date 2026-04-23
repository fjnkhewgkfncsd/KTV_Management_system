const mongoose = require("mongoose");

const PRODUCT_CATEGORIES = ["drink", "food", "snack", "other"];

const validateProductPayload = (payload, { partial = false } = {}) => {
  const errors = [];

  if (!partial || "name" in payload) {
    if (typeof payload.name !== "string" || payload.name.trim().length < 1 || payload.name.trim().length > 120) {
      errors.push({ field: "name", message: "name is required and must be 1 to 120 characters" });
    }
  }

  if (!partial || "category" in payload) {
    if (typeof payload.category !== "string" || !PRODUCT_CATEGORIES.includes(payload.category.trim().toLowerCase())) {
      errors.push({ field: "category", message: "category must be one of: drink, food, snack, other" });
    }
  }

  if (!partial || "price" in payload) {
    if (typeof payload.price !== "number" || Number.isNaN(payload.price) || payload.price < 0) {
      errors.push({ field: "price", message: "price must be a number greater than or equal to 0" });
    }
  }

  if (!partial || "stockQty" in payload) {
    if (!Number.isInteger(payload.stockQty) || payload.stockQty < 0) {
      errors.push({ field: "stockQty", message: "stockQty must be a non-negative integer" });
    }
  }

  if (!partial || "lowStockThreshold" in payload) {
    if (!Number.isInteger(payload.lowStockThreshold) || payload.lowStockThreshold < 0) {
      errors.push({ field: "lowStockThreshold", message: "lowStockThreshold must be a non-negative integer" });
    }
  }

  if ("isActive" in payload && typeof payload.isActive !== "boolean") {
    errors.push({ field: "isActive", message: "isActive must be a boolean" });
  }

  return errors;
};

const productIdParamValidator = (req) => {
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const productListQueryValidator = (req) => {
  const errors = [];
  const { category, isActive, lowStock } = req.query || {};

  if (category !== undefined && (typeof category !== "string" || !PRODUCT_CATEGORIES.includes(category.trim().toLowerCase()))) {
    errors.push({ field: "category", message: "category must be one of: drink, food, snack, other" });
  }

  if (isActive !== undefined && !["true", "false"].includes(isActive)) {
    errors.push({ field: "isActive", message: "isActive must be true or false" });
  }

  if (lowStock !== undefined && !["true", "false"].includes(lowStock)) {
    errors.push({ field: "lowStock", message: "lowStock must be true or false" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const createProductValidator = (req) => ({
  valid: validateProductPayload(req.body || {}).length === 0,
  errors: validateProductPayload(req.body || {})
});

const updateProductValidator = (req) => {
  const errors = validateProductPayload(req.body || {}, { partial: true });

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const stockInValidator = (req) => {
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  if (!Number.isInteger(req.body?.quantity) || req.body.quantity < 1) {
    errors.push({ field: "quantity", message: "quantity must be a positive integer" });
  }

  if (req.body?.reason !== undefined && (typeof req.body.reason !== "string" || req.body.reason.length > 300)) {
    errors.push({ field: "reason", message: "reason must be a string with a maximum length of 300" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const stockAdjustmentValidator = (req) => {
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push({ field: "id", message: "id must be a valid ObjectId" });
  }

  if (!Number.isInteger(req.body?.newStockQty) || req.body.newStockQty < 0) {
    errors.push({ field: "newStockQty", message: "newStockQty must be a non-negative integer" });
  }

  if (req.body?.reason !== undefined && (typeof req.body.reason !== "string" || req.body.reason.length > 300)) {
    errors.push({ field: "reason", message: "reason must be a string with a maximum length of 300" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  createProductValidator,
  productIdParamValidator,
  productListQueryValidator,
  stockAdjustmentValidator,
  stockInValidator,
  updateProductValidator
};
