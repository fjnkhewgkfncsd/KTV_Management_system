const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  apiPrefix: process.env.API_PREFIX || "/api",
  appName: process.env.APP_NAME || "KTV Management System API",
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  defaultAdmin: {
    username: process.env.DEFAULT_ADMIN_USERNAME || "admin",
    password: process.env.DEFAULT_ADMIN_PASSWORD || "admin123",
    name: process.env.DEFAULT_ADMIN_NAME || "System Admin"
  },
  defaultReceptionist: {
    username: process.env.DEFAULT_RECEPTIONIST_USERNAME || "reception",
    password: process.env.DEFAULT_RECEPTIONIST_PASSWORD || "reception123",
    name: process.env.DEFAULT_RECEPTIONIST_NAME || "Front Desk"
  }
};

module.exports = env;
