const mongoose = require("mongoose");

const { Invoice, Room, Session } = require("../models");
const ApiError = require("../utils/ApiError");

const PAYMENT_METHODS = ["cash", "card", "qr"];
const PAYMENT_STATUSES = ["unpaid", "paid", "void"];

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeCheckoutPayload = (payload) => {
  const normalizedPayload = { ...payload };

  if (typeof normalizedPayload.paymentStatus === "string") {
    normalizedPayload.paymentStatus = normalizedPayload.paymentStatus.trim().toLowerCase();
  }

  if (typeof normalizedPayload.paymentMethod === "string") {
    normalizedPayload.paymentMethod = normalizedPayload.paymentMethod.trim().toLowerCase();
  }

  if (typeof normalizedPayload.notes === "string") {
    normalizedPayload.notes = normalizedPayload.notes.trim();
  }

  return normalizedPayload;
};

const calculateDurationMinutes = (startTime, endTime) => {
  const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  return Math.max(0, Math.ceil(diffMs / 60000));
};

const calculateRoomCharge = ({ startTime, endTime, hourlyRate }) => {
  const durationMinutes = calculateDurationMinutes(startTime, endTime);
  const roomCharge = roundMoney((durationMinutes / 60) * hourlyRate);

  return {
    durationMinutes,
    roomCharge
  };
};

const calculateProductCharge = (orderedItems = []) =>
  roundMoney(orderedItems.reduce((sum, item) => sum + item.lineTotal, 0));

const buildInvoiceLines = ({ session, roomCharge, durationMinutes }) => {
  const roomLine = {
    lineType: "room",
    referenceId: session.roomId,
    code: session.roomRateSnapshot.code,
    description: `${session.roomRateSnapshot.name} room charge`,
    quantity: Math.max(1, durationMinutes),
    unitPrice: roundMoney(session.roomRateSnapshot.hourlyRate / 60),
    lineTotal: roomCharge
  };

  const productLines = (session.orderedItems || []).map((item) => ({
    lineType: "product",
    referenceId: item.productId,
    code: "",
    description: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal
  }));

  return [roomLine, ...productLines];
};

const generateInvoiceNumber = () => {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const randomSuffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `INV-${timestamp}-${randomSuffix}`;
};

const buildInvoiceResponse = (invoice) => ({
  id: invoice._id,
  sessionId: invoice.sessionId,
  invoiceNumber: invoice.invoiceNumber,
  paymentStatus: invoice.paymentStatus,
  paymentMethod: invoice.paymentMethod,
  paidAt: invoice.paidAt,
  paidBy: invoice.paidBy,
  lines: invoice.lines,
  roomCharge: invoice.roomCharge,
  productCharge: invoice.productCharge,
  subtotal: invoice.subtotal,
  discountAmount: invoice.discountAmount,
  taxAmount: invoice.taxAmount,
  grandTotal: invoice.grandTotal,
  notes: invoice.notes,
  createdAt: invoice.createdAt,
  updatedAt: invoice.updatedAt
});

const assertValidPayment = ({ paymentStatus, paymentMethod }) => {
  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new ApiError(400, "Invalid paymentStatus", "INVALID_PAYMENT_STATUS");
  }

  if (paymentMethod !== null && paymentMethod !== undefined && !PAYMENT_METHODS.includes(paymentMethod)) {
    throw new ApiError(400, "Invalid paymentMethod", "INVALID_PAYMENT_METHOD");
  }

  if (paymentStatus === "paid" && !paymentMethod) {
    throw new ApiError(400, "paymentMethod is required when paymentStatus is paid", "PAYMENT_METHOD_REQUIRED");
  }
};

const checkoutSession = async (sessionId, payload, userId) => {
  const normalizedPayload = normalizeCheckoutPayload(payload);
  const session = await Session.findById(sessionId);

  if (!session) {
    throw new ApiError(404, "Session not found", "SESSION_NOT_FOUND");
  }

  if (session.status !== "open") {
    throw new ApiError(400, "Only active sessions can be checked out", "SESSION_NOT_CHECKOUTABLE");
  }

  if (session.invoiceId) {
    throw new ApiError(409, "Session already has an invoice", "INVOICE_ALREADY_EXISTS");
  }

  const existingInvoice = await Invoice.findOne({ sessionId });

  if (existingInvoice) {
    throw new ApiError(409, "Session already has an invoice", "INVOICE_ALREADY_EXISTS");
  }

  const paymentStatus = normalizedPayload.paymentStatus || "unpaid";
  const paymentMethod = normalizedPayload.paymentMethod || null;
  const discountAmount = roundMoney(normalizedPayload.discountAmount || 0);
  const taxAmount = roundMoney(normalizedPayload.taxAmount || 0);
  const checkoutTime = normalizedPayload.checkoutTime ? new Date(normalizedPayload.checkoutTime) : new Date();

  assertValidPayment({ paymentStatus, paymentMethod });

  if (checkoutTime < session.startTime) {
    throw new ApiError(400, "checkoutTime must be later than or equal to session startTime", "INVALID_CHECKOUT_TIME");
  }

  const { durationMinutes, roomCharge } = calculateRoomCharge({
    startTime: session.startTime,
    endTime: checkoutTime,
    hourlyRate: session.roomRateSnapshot.hourlyRate
  });
  const productCharge = calculateProductCharge(session.orderedItems);
  const subtotal = roundMoney(roomCharge + productCharge);
  const grandTotal = roundMoney(subtotal - discountAmount + taxAmount);

  if (discountAmount < 0 || taxAmount < 0) {
    throw new ApiError(400, "discountAmount and taxAmount must be non-negative", "INVALID_INVOICE_AMOUNT");
  }

  if (grandTotal < 0) {
    throw new ApiError(400, "grandTotal cannot be negative", "INVALID_GRAND_TOTAL");
  }

  const invoice = await Invoice.create({
    sessionId: session._id,
    invoiceNumber: generateInvoiceNumber(),
    paymentStatus,
    paymentMethod,
    paidAt: paymentStatus === "paid" ? checkoutTime : null,
    paidBy: paymentStatus === "paid" ? userId : null,
    lines: buildInvoiceLines({ session, roomCharge, durationMinutes }),
    roomCharge,
    productCharge,
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
    notes: normalizedPayload.notes || ""
  });

  session.status = "closed";
  session.endTime = checkoutTime;
  session.closedBy = userId;
  session.invoiceId = invoice._id;
  await session.save();

  const room = await Room.findById(session.roomId);

  if (room) {
    if (room.currentSessionId && room.currentSessionId.toString() === session._id.toString()) {
      room.currentSessionId = null;
    }

    if (session.reservationId && room.activeReservationId && room.activeReservationId.toString() === session.reservationId.toString()) {
      room.activeReservationId = null;
    }

    room.status = "cleaning";
    await room.save();
  }

  return buildInvoiceResponse(invoice);
};

const getInvoiceById = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  return buildInvoiceResponse(invoice);
};

module.exports = {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  roundMoney,
  calculateDurationMinutes,
  calculateRoomCharge,
  calculateProductCharge,
  normalizeCheckoutPayload,
  buildInvoiceLines,
  buildInvoiceResponse,
  checkoutSession,
  getInvoiceById
};
