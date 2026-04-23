const express = require("express");

const authRoutes = require("./auth.routes");
const healthRoutes = require("./health.routes");
const invoiceRoutes = require("./invoice.routes");
const productRoutes = require("./product.routes");
const reportRoutes = require("./report.routes");
const reservationRoutes = require("./reservation.routes");
const roomRoutes = require("./room.routes");
const sessionRoutes = require("./session.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/products", productRoutes);
router.use("/reports", reportRoutes);
router.use("/reservations", reservationRoutes);
router.use("/rooms", roomRoutes);
router.use("/sessions", sessionRoutes);

module.exports = router;
