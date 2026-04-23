const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildInvoiceLines,
  calculateDurationMinutes,
  calculateProductCharge,
  calculateRoomCharge,
  roundMoney
} = require("../src/services/invoice.service");

test("calculateDurationMinutes rounds up partial minutes", () => {
  const minutes = calculateDurationMinutes("2026-04-21T10:00:00.000Z", "2026-04-21T11:00:30.000Z");

  assert.equal(minutes, 61);
});

test("calculateRoomCharge uses roomRateSnapshot hourly rate", () => {
  const result = calculateRoomCharge({
    startTime: "2026-04-21T10:00:00.000Z",
    endTime: "2026-04-21T12:30:00.000Z",
    hourlyRate: 300
  });

  assert.equal(result.durationMinutes, 150);
  assert.equal(result.roomCharge, 750);
});

test("calculateProductCharge sums ordered items", () => {
  const total = calculateProductCharge([
    { lineTotal: 70 },
    { lineTotal: 105.5 }
  ]);

  assert.equal(total, 175.5);
});

test("buildInvoiceLines includes room and product lines", () => {
  const lines = buildInvoiceLines({
    session: {
      roomId: "room1",
      roomRateSnapshot: {
        code: "A101",
        name: "Room A101",
        hourlyRate: 300
      },
      orderedItems: [
        {
          productId: "product1",
          productName: "Coke",
          quantity: 2,
          unitPrice: 35,
          lineTotal: 70
        }
      ]
    },
    roomCharge: 300,
    durationMinutes: 60
  });

  assert.equal(lines.length, 2);
  assert.equal(lines[0].lineType, "room");
  assert.equal(lines[0].lineTotal, 300);
  assert.equal(lines[1].lineType, "product");
  assert.equal(lines[1].description, "Coke");
});

test("checkout arithmetic produces correct grand total shape", () => {
  const roomCharge = 600;
  const productCharge = 140;
  const subtotal = roundMoney(roomCharge + productCharge);
  const discountAmount = 40;
  const taxAmount = 49;
  const grandTotal = roundMoney(subtotal - discountAmount + taxAmount);

  assert.equal(subtotal, 740);
  assert.equal(grandTotal, 749);
});
