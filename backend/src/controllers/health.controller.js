const healthService = require("../services/health.service");
const { successResponse } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getHealthStatus = asyncHandler(async (_req, res) => {
  const healthStatus = healthService.getHealthStatus();

  return successResponse(res, {
    message: "Service is healthy",
    data: healthStatus
  });
});

module.exports = {
  getHealthStatus
};
