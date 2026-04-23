const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyRoomStateInvariants,
  assertValidStatusTransition,
  normalizeRoomPayload
} = require("../src/services/room.service");

test("normalizeRoomPayload normalizes case and trims strings", () => {
  const payload = normalizeRoomPayload({
    code: " a101 ",
    name: " Room A101 ",
    type: " VIP ",
    status: " OCCUPIED ",
    notes: " ready ",
    currentSessionId: "",
    activeReservationId: ""
  });

  assert.equal(payload.code, "A101");
  assert.equal(payload.name, "Room A101");
  assert.equal(payload.type, "vip");
  assert.equal(payload.status, "occupied");
  assert.equal(payload.notes, "ready");
  assert.equal(payload.currentSessionId, null);
  assert.equal(payload.activeReservationId, null);
});

test("assertValidStatusTransition allows operationally valid transitions", () => {
  assert.doesNotThrow(() => assertValidStatusTransition("available", "reserved"));
  assert.doesNotThrow(() => assertValidStatusTransition("reserved", "occupied"));
  assert.doesNotThrow(() => assertValidStatusTransition("occupied", "cleaning"));
  assert.doesNotThrow(() => assertValidStatusTransition("cleaning", "available"));
});

test("assertValidStatusTransition blocks invalid transitions", () => {
  assert.throws(
    () => assertValidStatusTransition("occupied", "available"),
    /Invalid room status transition/
  );
  assert.throws(
    () => assertValidStatusTransition("maintenance", "occupied"),
    /Invalid room status transition/
  );
});

test("applyRoomStateInvariants requires currentSessionId for occupied rooms", () => {
  assert.throws(
    () => applyRoomStateInvariants({ status: "occupied", currentSessionId: null }),
    /currentSessionId/
  );
});

test("applyRoomStateInvariants requires activeReservationId for reserved rooms", () => {
  assert.throws(
    () => applyRoomStateInvariants({ status: "reserved", activeReservationId: null }),
    /activeReservationId/
  );
});

test("applyRoomStateInvariants clears session and reservation refs when room becomes available", () => {
  const nextState = applyRoomStateInvariants(
    { status: "available" },
    {
      status: "occupied",
      currentSessionId: "507f1f77bcf86cd799439011",
      activeReservationId: "507f191e810c19729de860ea"
    }
  );

  assert.equal(nextState.currentSessionId, null);
  assert.equal(nextState.activeReservationId, null);
});
