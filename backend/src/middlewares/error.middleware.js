const ApiError = require("../utils/ApiError");

const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, "NOT_FOUND"));
};

const errorHandler = (error, _req, res, _next) => {
  let normalizedError = error;

  if (error.name === "ValidationError") {
    normalizedError = new ApiError(400, "Validation failed", "VALIDATION_ERROR", {
      fields: Object.values(error.errors).map((item) => ({
        field: item.path,
        message: item.message
      }))
    });
  }

  if (error.name === "CastError") {
    normalizedError = new ApiError(400, `Invalid ${error.path}: ${error.value}`, "CAST_ERROR");
  }

  if (error.code === 11000) {
    normalizedError = new ApiError(409, "Duplicate value detected", "DUPLICATE_KEY", {
      fields: Object.keys(error.keyPattern || {})
    });
  }

  const statusCode = normalizedError.statusCode || 500;
  const errorCode = normalizedError.code || "INTERNAL_SERVER_ERROR";
  const message = normalizedError.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode,
      details: normalizedError.details || null
    }
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
