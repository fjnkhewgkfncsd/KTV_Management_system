const sessionService = require("../services/session.service");
const { successResponse } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const createWalkInSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createWalkInSession(req.body, req.user.userId);

  return successResponse(res, {
    statusCode: 201,
    message: "Session created successfully",
    data: { session }
  });
});

const createSessionFromReservation = asyncHandler(async (req, res) => {
  const session = await sessionService.createSessionFromReservation(req.params.reservationId, req.user.userId);

  return successResponse(res, {
    statusCode: 201,
    message: "Session created from reservation successfully",
    data: { session }
  });
});

const listActiveSessions = asyncHandler(async (_req, res) => {
  const result = await sessionService.listActiveSessions();

  return successResponse(res, {
    message: "Active sessions retrieved successfully",
    data: result
  });
});

const getSessionById = asyncHandler(async (req, res) => {
  const session = await sessionService.getSessionById(req.params.id);

  return successResponse(res, {
    message: "Session retrieved successfully",
    data: { session }
  });
});

const addItemsToSession = asyncHandler(async (req, res) => {
  const session = await sessionService.addItemsToSession(req.params.id, req.body, req.user.userId);

  return successResponse(res, {
    message: "Items added to session successfully",
    data: { session }
  });
});

const closeSession = asyncHandler(async (req, res) => {
  const session = await sessionService.closeSession(req.params.id, req.user.userId);

  return successResponse(res, {
    message: "Session closed successfully",
    data: { session }
  });
});

module.exports = {
  createWalkInSession,
  createSessionFromReservation,
  listActiveSessions,
  getSessionById,
  addItemsToSession,
  closeSession
};
