const { Product, StockMovement } = require("../models");
const ApiError = require("../utils/ApiError");

const STOCK_MOVEMENT_TYPES = ["stock_in", "sale", "adjustment", "damaged"];

const normalizeProductPayload = (payload) => {
  const normalizedPayload = { ...payload };

  if (typeof normalizedPayload.name === "string") {
    normalizedPayload.name = normalizedPayload.name.trim();
  }

  if (typeof normalizedPayload.category === "string") {
    normalizedPayload.category = normalizedPayload.category.trim().toLowerCase();
  }

  return normalizedPayload;
};

const buildProductResponse = (product) => ({
  id: product._id,
  name: product.name,
  category: product.category,
  price: product.price,
  stockQty: product.stockQty,
  lowStockThreshold: product.lowStockThreshold,
  isActive: product.isActive,
  isLowStock: product.stockQty <= product.lowStockThreshold,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt
});

const buildStockMovementResponse = (movement) => ({
  id: movement._id,
  productId: movement.productId,
  movementType: movement.movementType,
  quantity: movement.quantity,
  beforeQty: movement.beforeQty,
  afterQty: movement.afterQty,
  reason: movement.reason,
  createdBy: movement.createdBy,
  sessionId: movement.sessionId,
  invoiceId: movement.invoiceId,
  createdAt: movement.createdAt,
  updatedAt: movement.updatedAt
});

const getProductDocumentOrThrow = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  return product;
};

const createStockMovement = async ({
  product,
  movementType,
  quantity,
  beforeQty,
  afterQty,
  reason = "",
  createdBy = null
}) => {
  return StockMovement.create({
    productId: product._id,
    movementType,
    quantity,
    beforeQty,
    afterQty,
    reason,
    createdBy
  });
};

const applyStockMovement = async ({ product, movementType, quantity, reason = "", createdBy = null }) => {
  if (!STOCK_MOVEMENT_TYPES.includes(movementType)) {
    throw new ApiError(400, "Invalid stock movement type", "INVALID_STOCK_MOVEMENT_TYPE");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(400, "quantity must be a positive integer", "INVALID_STOCK_QUANTITY");
  }

  let stockDelta = 0;

  if (movementType === "stock_in") {
    stockDelta = quantity;
  }

  if (movementType === "sale" || movementType === "damaged") {
    stockDelta = -quantity;
  }

  const updateFilter = { _id: product._id };

  if (stockDelta < 0) {
    updateFilter.stockQty = { $gte: quantity };
  }

  const updatedProduct = await Product.findOneAndUpdate(updateFilter, { $inc: { stockQty: stockDelta } }, { new: true });

  if (!updatedProduct) {
    throw new ApiError(400, "Stock cannot go below zero", "NEGATIVE_STOCK_NOT_ALLOWED");
  }

  const beforeQty = product.stockQty;
  const afterQty = updatedProduct.stockQty;

  const movement = await createStockMovement({
    product,
    movementType,
    quantity,
    beforeQty,
    afterQty,
    reason,
    createdBy
  });

  product.stockQty = afterQty;
  product.updatedAt = updatedProduct.updatedAt;

  return {
    product: buildProductResponse(updatedProduct),
    stockMovement: buildStockMovementResponse(movement)
  };
};

const createProduct = async (payload, userId = null) => {
  const normalizedPayload = normalizeProductPayload(payload);
  const initialStockQty = normalizedPayload.stockQty ?? 0;

  const product = await Product.create({
    name: normalizedPayload.name,
    category: normalizedPayload.category,
    price: normalizedPayload.price,
    stockQty: initialStockQty,
    lowStockThreshold: normalizedPayload.lowStockThreshold ?? 0,
    isActive: normalizedPayload.isActive ?? true
  });

  if (initialStockQty > 0) {
    await StockMovement.create({
      productId: product._id,
      movementType: "stock_in",
      quantity: initialStockQty,
      beforeQty: 0,
      afterQty: initialStockQty,
      reason: "Initial product stock",
      createdBy: userId
    });
  }

  return buildProductResponse(product);
};

const listProducts = async (query) => {
  const filter = {};

  if (query.category) {
    filter.category = query.category.trim().toLowerCase();
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  let products = await Product.find(filter).sort({ name: 1 });

  if (query.lowStock === "true") {
    products = products.filter((product) => product.stockQty <= product.lowStockThreshold);
  }

  return {
    products: products.map(buildProductResponse),
    total: products.length
  };
};

const getProductById = async (productId) => {
  const product = await getProductDocumentOrThrow(productId);

  return buildProductResponse(product);
};

const updateProduct = async (productId, payload) => {
  const product = await getProductDocumentOrThrow(productId);
  const normalizedPayload = normalizeProductPayload(payload);

  if (normalizedPayload.name !== undefined) {
    product.name = normalizedPayload.name;
  }

  if (normalizedPayload.category !== undefined) {
    product.category = normalizedPayload.category;
  }

  if (normalizedPayload.price !== undefined) {
    product.price = normalizedPayload.price;
  }

  if (normalizedPayload.lowStockThreshold !== undefined) {
    product.lowStockThreshold = normalizedPayload.lowStockThreshold;
  }

  if (normalizedPayload.isActive !== undefined) {
    product.isActive = normalizedPayload.isActive;
  }

  await product.save();

  return buildProductResponse(product);
};

const stockInProduct = async (productId, payload, userId) => {
  const product = await getProductDocumentOrThrow(productId);

  return applyStockMovement({
    product,
    movementType: "stock_in",
    quantity: payload.quantity,
    reason: payload.reason || "",
    createdBy: userId
  });
};

const adjustProductStock = async (productId, payload, userId) => {
  const product = await getProductDocumentOrThrow(productId);

  if (!Number.isInteger(payload.newStockQty) || payload.newStockQty < 0) {
    throw new ApiError(400, "newStockQty must be a non-negative integer", "INVALID_NEW_STOCK_QTY");
  }

  const beforeQty = product.stockQty;
  const afterQty = payload.newStockQty;
  const quantity = Math.abs(afterQty - beforeQty);

  if (quantity === 0) {
    throw new ApiError(400, "newStockQty must be different from the current stock", "NO_STOCK_CHANGE");
  }

  const movement = await StockMovement.create({
    productId: product._id,
    movementType: "adjustment",
    quantity,
    beforeQty,
    afterQty,
    reason: payload.reason || "",
    createdBy: userId
  });

  product.stockQty = afterQty;
  await product.save();

  return {
    product: buildProductResponse(product),
    stockMovement: buildStockMovementResponse(movement)
  };
};

const listProductStockMovements = async (productId) => {
  await getProductDocumentOrThrow(productId);

  const stockMovements = await StockMovement.find({ productId }).sort({ createdAt: -1 });

  return {
    stockMovements: stockMovements.map(buildStockMovementResponse),
    total: stockMovements.length
  };
};

module.exports = {
  STOCK_MOVEMENT_TYPES,
  normalizeProductPayload,
  buildProductResponse,
  buildStockMovementResponse,
  getProductDocumentOrThrow,
  applyStockMovement,
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  stockInProduct,
  adjustProductStock,
  listProductStockMovements
};
