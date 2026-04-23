const express = require("express");

const sessionController = require("../controllers/session.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  sessionIdParamValidator,
  reservationSessionParamValidator,
  createWalkInSessionValidator,
  addSessionItemsValidator
} = require("../validators/session.validator");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "receptionist"));

router.get("/active", sessionController.listActiveSessions);
router.get("/:id", validate(sessionIdParamValidator), sessionController.getSessionById);
router.post("/walk-in", validate(createWalkInSessionValidator), sessionController.createWalkInSession);
router.patch("/:id/items", validate(addSessionItemsValidator), sessionController.addItemsToSession);
router.post(
  "/from-reservation/:reservationId",
  validate(reservationSessionParamValidator),
  sessionController.createSessionFromReservation
);
router.patch("/:id/close", validate(sessionIdParamValidator), sessionController.closeSession);

module.exports = router;
