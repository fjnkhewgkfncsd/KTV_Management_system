const express = require("express");

const reservationController = require("../controllers/reservation.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createReservationValidator,
  reservationIdParamValidator,
  reservationListQueryValidator,
  updateReservationValidator
} = require("../validators/reservation.validator");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "receptionist"));

router.get("/", validate(reservationListQueryValidator), reservationController.listReservations);
router.get("/:id", validate(reservationIdParamValidator), reservationController.getReservationById);
router.post("/", validate(createReservationValidator), reservationController.createReservation);
router.put("/:id", validate(updateReservationValidator), reservationController.updateReservation);
router.patch("/:id/cancel", validate(reservationIdParamValidator), reservationController.cancelReservation);
router.patch("/:id/check-in", validate(reservationIdParamValidator), reservationController.checkInReservation);

module.exports = router;
