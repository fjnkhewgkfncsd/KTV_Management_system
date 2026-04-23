const ApiError = require("../utils/ApiError");

const validate = (validator) => (req, _res, next) => {
  const result = validator(req);

  if (!result.valid) {
    return next(
      new ApiError(400, "Validation failed", "VALIDATION_ERROR", {
        fields: result.errors
      })
    );
  }

  return next();
};

module.exports = validate;
