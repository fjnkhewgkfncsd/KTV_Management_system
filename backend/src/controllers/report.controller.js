const reportService = require("../services/report.service");
const { successResponse } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getDailyRevenueReport = asyncHandler(async (req, res) => {
  const report = await reportService.getDailyRevenueReport(req.query);

  return successResponse(res, {
    message: "Daily revenue report retrieved successfully",
    data: { report }
  });
});

const getMonthlyRevenueReport = asyncHandler(async (req, res) => {
  const report = await reportService.getMonthlyRevenueReport(req.query);

  return successResponse(res, {
    message: "Monthly revenue report retrieved successfully",
    data: { report }
  });
});

const getRangeRevenueReport = asyncHandler(async (req, res) => {
  const report = await reportService.getRangeRevenueReport(req.query);

  return successResponse(res, {
    message: "Range revenue report retrieved successfully",
    data: { report }
  });
});

module.exports = {
  getDailyRevenueReport,
  getMonthlyRevenueReport,
  getRangeRevenueReport
};
