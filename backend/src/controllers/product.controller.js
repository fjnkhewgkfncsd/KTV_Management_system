const productService = require("../services/product.service");
const { successResponse } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const listProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query);

  return successResponse(res, {
    message: "Products retrieved successfully",
    data: result
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user.userId);

  return successResponse(res, {
    statusCode: 201,
    message: "Product created successfully",
    data: { product }
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  return successResponse(res, {
    message: "Product updated successfully",
    data: { product }
  });
});

const stockInProduct = asyncHandler(async (req, res) => {
  const result = await productService.stockInProduct(req.params.id, req.body, req.user.userId);

  return successResponse(res, {
    message: "Product stock increased successfully",
    data: result
  });
});

const adjustProductStock = asyncHandler(async (req, res) => {
  const result = await productService.adjustProductStock(req.params.id, req.body, req.user.userId);

  return successResponse(res, {
    message: "Product stock adjusted successfully",
    data: result
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  return successResponse(res, {
    message: "Product retrieved successfully",
    data: { product }
  });
});

const listProductStockMovements = asyncHandler(async (req, res) => {
  const result = await productService.listProductStockMovements(req.params.id);

  return successResponse(res, {
    message: "Stock movements retrieved successfully",
    data: result
  });
});

module.exports = {
  listProducts,
  createProduct,
  updateProduct,
  stockInProduct,
  adjustProductStock,
  getProductById,
  listProductStockMovements
};
