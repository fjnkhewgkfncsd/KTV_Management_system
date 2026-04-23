const jwt = require("jsonwebtoken");

const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const authenticate = (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication token is required", "UNAUTHORIZED"));
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    return next();
  } catch (_error) {
    return next(new ApiError(401, "Invalid or expired authentication token", "INVALID_TOKEN"));
  }
};

const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication is required", "UNAUTHORIZED"));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to perform this action", "FORBIDDEN"));
  }

  return next();
};

module.exports = {
  authenticate,
  authorizeRoles
};
