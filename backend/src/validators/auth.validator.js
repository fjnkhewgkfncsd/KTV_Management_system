const loginValidator = (req) => {
  const errors = [];
  const { username, password } = req.body || {};

  if (typeof username !== "string" || username.trim().length < 3) {
    errors.push({
      field: "username",
      message: "username must be at least 3 characters"
    });
  }

  if (typeof password !== "string" || password.length < 6) {
    errors.push({
      field: "password",
      message: "password must be at least 6 characters"
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  loginValidator
};
