const express = require("express");

const reportController = require("../controllers/report.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  dailyRevenueReportValidator,
  monthlyRevenueReportValidator,
  rangeRevenueReportValidator
} = require("../validators/report.validator");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "receptionist"));

router.get("/revenue/daily", validate(dailyRevenueReportValidator), reportController.getDailyRevenueReport);
router.get("/revenue/monthly", validate(monthlyRevenueReportValidator), reportController.getMonthlyRevenueReport);
router.get("/revenue/range", validate(rangeRevenueReportValidator), reportController.getRangeRevenueReport);

module.exports = router;
