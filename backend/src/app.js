const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const env = require("./config/env");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== "test") {
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
}

app.use(env.apiPrefix, routes);

app.get("/", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: `${env.appName} is running`,
    data: {
      healthCheck: `${env.apiPrefix}/health`
    }
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
