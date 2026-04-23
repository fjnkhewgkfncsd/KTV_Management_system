const express = require("express");

const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { loginValidator } = require("../validators/auth.validator");

const router = express.Router();

router.post("/login", validate(loginValidator), authController.login);
router.get("/me", authenticate, authController.getCurrentUser);

module.exports = router;
