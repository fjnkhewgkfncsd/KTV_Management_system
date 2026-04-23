const invoiceService = require("../services/invoice.service");
const { successResponse } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const checkoutSession = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.checkoutSession(req.params.sessionId, req.body, req.user.userId);

  return successResponse(res, {
    statusCode: 201,
    message: "Session checked out successfully",
    data: { invoice }
  });
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);

  return successResponse(res, {
    message: "Invoice retrieved successfully",
    data: { invoice }
  });
});

module.exports = {
  checkoutSession,
  getInvoiceById
};
