const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateReservedEndTime,
  hasReservationConflict,
  isReservationCurrentlyActive,
  normalizeReservationPayload
} = require("../src/services/reservation.service");

test("calculateReservedEndTime adds expectedDuration in minutes", () => {
  const endTime = calculateReservedEndTime("2026-04-21T10:00:00.000Z", 120);

  assert.equal(endTime.toISOString(), "2026-04-21T12:00:00.000Z");
});

test("hasReservationConflict returns true for overlapping bookings", () => {
  const conflict = hasReservationConflict({
    existingStartTime: new Date("2026-04-21T10:00:00.000Z"),
    existingEndTime: new Date("2026-04-21T12:00:00.000Z"),
    requestedStartTime: new Date("2026-04-21T11:00:00.000Z"),
    requestedEndTime: new Date("2026-04-21T13:00:00.000Z")
  });

  assert.equal(conflict, true);
});

test("hasReservationConflict returns false for back-to-back bookings", () => {
  const conflict = hasReservationConflict({
    existingStartTime: new Date("2026-04-21T10:00:00.000Z"),
    existingEndTime: new Date("2026-04-21T12:00:00.000Z"),
    requestedStartTime: new Date("2026-04-21T12:00:00.000Z"),
    requestedEndTime: new Date("2026-04-21T14:00:00.000Z")
  });

  assert.equal(conflict, false);
});

test("normalizeReservationPayload trims values and normalizes status", () => {
  const payload = normalizeReservationPayload({
    customerName: " Somchai ",
    customerPhone: " 0812345678 ",
    status: " CONFIRMED ",
    reservedStartTime: "2026-04-21T10:00:00.000Z",
    notes: " VIP guest "
  });

  assert.equal(payload.customerName, "Somchai");
  assert.equal(payload.customerPhone, "0812345678");
  assert.equal(payload.status, "confirmed");
  assert.equal(payload.reservedStartTime.toISOString(), "2026-04-21T10:00:00.000Z");
  assert.equal(payload.notes, "VIP guest");
});

test("isReservationCurrentlyActive returns true for current reservations", () => {
  const active = isReservationCurrentlyActive(
    {
      status: "confirmed",
      reservedStartTime: new Date("2026-04-21T10:00:00.000Z"),
      expectedDuration: 120
    },
    new Date("2026-04-21T11:00:00.000Z")
  );

  assert.equal(active, true);
});

test("isReservationCurrentlyActive returns false for cancelled reservations", () => {
  const active = isReservationCurrentlyActive(
    {
      status: "cancelled",
      reservedStartTime: new Date("2026-04-21T10:00:00.000Z"),
      expectedDuration: 120
    },
    new Date("2026-04-21T11:00:00.000Z")
  );

  assert.equal(active, false);
});
