const roomService = require("../services/room.service");
const { successResponse } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const listRooms = asyncHandler(async (req, res) => {
  const result = await roomService.listRooms(req.query);

  return successResponse(res, {
    message: "Rooms retrieved successfully",
    data: result
  });
});

const getRoomById = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomById(req.params.id);

  return successResponse(res, {
    message: "Room retrieved successfully",
    data: { room }
  });
});

const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom(req.body);

  return successResponse(res, {
    statusCode: 201,
    message: "Room created successfully",
    data: { room }
  });
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await roomService.updateRoom(req.params.id, req.body);

  return successResponse(res, {
    message: "Room updated successfully",
    data: { room }
  });
});

const updateRoomStatus = asyncHandler(async (req, res) => {
  const room = await roomService.updateRoomStatus(req.params.id, req.body);

  return successResponse(res, {
    message: "Room status updated successfully",
    data: { room }
  });
});

module.exports = {
  listRooms,
  getRoomById,
  createRoom,
  updateRoom,
  updateRoomStatus
};
