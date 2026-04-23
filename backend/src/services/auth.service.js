const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");

const sanitizeUser = (user) => ({
  id: user._id,
  username: user.username,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const signToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );

const login = async ({ username, password }) => {
  const normalizedUsername = username.trim().toLowerCase();

  const user = await User.findOne({ username: normalizedUsername });

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid username or password", "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid username or password", "INVALID_CREDENTIALS");
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: signToken(user),
    user: sanitizeUser(user)
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(401, "Authenticated user no longer exists", "USER_NOT_FOUND");
  }

  return sanitizeUser(user);
};

module.exports = {
  login,
  getCurrentUser,
  signToken,
  sanitizeUser
};
