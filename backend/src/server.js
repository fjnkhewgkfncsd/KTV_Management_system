const http = require("http");

const app = require("./app");
const env = require("./config/env");
const connectToDatabase = require("./config/db");

let server;

const startServer = async () => {
  await connectToDatabase();

  server = http.createServer(app);

  server.listen(env.port, () => {
    console.log(`${env.appName} listening on port ${env.port}`);
  });
};

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully.`);

  if (!server) {
    process.exit(0);
  }

  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  shutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
