const reservationService = require("../services/reservation.service");
const { successResponse } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const listReservations = asyncHandler(async (req, res) => {
  const result = await reservationService.listReservations(req.query);

  return successResponse(res, {
    message: "Reservations retrieved successfully",
    data: result
  });
});

const getReservationById = asyncHandler(async (req, res) => {
  const reservation = await reservationService.getReservationById(req.params.id);

  return successResponse(res, {
    message: "Reservation retrieved successfully",
    data: { reservation }
  });
});

const createReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.createReservation(req.body, req.user?.userId || null);

  return successResponse(res, {
    statusCode: 201,
    message: "Reservation created successfully",
    data: { reservation }
  });
});

const updateReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.updateReservation(req.params.id, req.body);

  return successResponse(res, {
    message: "Reservation updated successfully",
    data: { reservation }
  });
});

const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.cancelReservation(req.params.id);

  return successResponse(res, {
    message: "Reservation cancelled successfully",
    data: { reservation }
  });
});

const checkInReservation = asyncHandler(async (req, res) => {
  const result = await reservationService.checkInReservation(req.params.id);

  return successResponse(res, {
    message: "Reservation checked in successfully",
    data: result
  });
});

module.exports = {
  listReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
  checkInReservation
};
