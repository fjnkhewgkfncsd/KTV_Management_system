const authService = require("../services/auth.service");
const { successResponse } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  return successResponse(res, {
    message: "Login successful",
    data: result
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.userId);

  return successResponse(res, {
    message: "Authenticated user retrieved successfully",
    data: { user }
  });
});

module.exports = {
  login,
  getCurrentUser
};
