const mongoose = require("mongoose");

const env = require("../config/env");

const getHealthStatus = () => {
  const mongoStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  return {
    service: env.appName,
    environment: env.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: mongoStateMap[mongoose.connection.readyState] || "unknown"
    }
  };
};

module.exports = {
  getHealthStatus
};
