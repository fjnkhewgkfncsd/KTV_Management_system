const express = require("express");

const roomController = require("../controllers/room.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createRoomValidator,
  roomIdParamValidator,
  roomListQueryValidator,
  updateRoomStatusValidator,
  updateRoomValidator
} = require("../validators/room.validator");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "receptionist"));

router.get("/", validate(roomListQueryValidator), roomController.listRooms);
router.get("/:id", validate(roomIdParamValidator), roomController.getRoomById);
router.post("/", authorizeRoles("admin"), validate(createRoomValidator), roomController.createRoom);
router.put("/:id", authorizeRoles("admin"), validate(updateRoomValidator), roomController.updateRoom);
router.patch(
  "/:id/status",
  authorizeRoles("admin", "receptionist"),
  validate(updateRoomStatusValidator),
  roomController.updateRoomStatus
);

module.exports = router;
