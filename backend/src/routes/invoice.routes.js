const express = require("express");

const invoiceController = require("../controllers/invoice.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { checkoutValidator, invoiceIdParamValidator } = require("../validators/invoice.validator");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "receptionist"));

router.post("/checkout/:sessionId", validate(checkoutValidator), invoiceController.checkoutSession);
router.get("/:id", validate(invoiceIdParamValidator), invoiceController.getInvoiceById);

module.exports = router;
