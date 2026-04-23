const test = require("node:test");
const assert = require("node:assert/strict");

const {
  addItemsToSession,
  assertRoomCanStartSession,
  buildRoomRateSnapshot,
  normalizeSessionPayload,
  recalculateSessionTotals
} = require("../src/services/session.service");

test("normalizeSessionPayload trims customer data", () => {
  const payload = normalizeSessionPayload({
    customerName: " Somchai ",
    customerPhone: " 0812345678 ",
    notes: " VIP walk-in ",
    startTime: "2026-04-21T10:00:00.000Z"
  });

  assert.equal(payload.customerName, "Somchai");
  assert.equal(payload.customerPhone, "0812345678");
  assert.equal(payload.notes, "VIP walk-in");
  assert.equal(payload.startTime.toISOString(), "2026-04-21T10:00:00.000Z");
});

test("buildRoomRateSnapshot captures the current room rate", () => {
  const snapshot = buildRoomRateSnapshot({
    _id: "6805f0fe7db7a0f4b3d53c10",
    code: "A101",
    name: "Room A101",
    type: "standard",
    hourlyRate: 300
  });

  assert.equal(snapshot.code, "A101");
  assert.equal(snapshot.hourlyRate, 300);
  assert.equal(snapshot.type, "standard");
});

test("assertRoomCanStartSession blocks active-session conflicts from room state", () => {
  assert.throws(
    () =>
      assertRoomCanStartSession({
        room: {
          _id: "6805f0fe7db7a0f4b3d53c10",
          isActive: true,
          status: "occupied",
          currentSessionId: "6805f0fe7db7a0f4b3d53c20"
        }
      }),
    /active session/
  );
});

test("assertRoomCanStartSession blocks active-session conflicts from query result", () => {
  assert.throws(
    () =>
      assertRoomCanStartSession({
        room: {
          _id: "6805f0fe7db7a0f4b3d53c10",
          isActive: true,
          status: "available",
          currentSessionId: null
        },
        existingActiveSession: {
          _id: "6805f0fe7db7a0f4b3d53c20",
          status: "open"
        }
      }),
    /active session/
  );
});

test("assertRoomCanStartSession allows a usable room without active session", () => {
  assert.doesNotThrow(() =>
    assertRoomCanStartSession({
      room: {
        _id: "6805f0fe7db7a0f4b3d53c10",
        isActive: true,
        status: "available",
        currentSessionId: null
      },
      existingActiveSession: null
    })
  );
});

test("recalculateSessionTotals sums ordered item line totals", () => {
  const session = {
    orderedItems: [
      { lineTotal: 70 },
      { lineTotal: 105 }
    ]
  };

  recalculateSessionTotals(session);

  assert.equal(session.itemsSubtotal, 175);
  assert.equal(session.totalAmount, 175);
});

test("addItemsToSession rejects closed sessions", async () => {
  const models = require("../src/models");
  const originalFindById = models.Session.findById;

  models.Session.findById = async () => ({
    _id: "session1",
    status: "closed"
  });

  try {
    await assert.rejects(
      () =>
        addItemsToSession(
          "session1",
          { items: [{ productId: "507f1f77bcf86cd799439011", quantity: 1 }] },
          "user1"
        ),
      /Only active sessions can receive ordered items/
    );
  } finally {
    models.Session.findById = originalFindById;
  }
});

test("addItemsToSession rejects insufficient stock", async () => {
  const models = require("../src/models");
  const productService = require("../src/services/product.service");
  const originalSessionFindById = models.Session.findById;
  const originalGetProductDocumentOrThrow = productService.getProductDocumentOrThrow;

  models.Session.findById = async () => ({
    _id: "session1",
    status: "open",
    orderedItems: [],
    save: async function save() {
      return this;
    }
  });

  productService.getProductDocumentOrThrow = async () => ({
    _id: "product1",
    name: "Coke",
    price: 35,
    stockQty: 0,
    isActive: true
  });

  try {
    await assert.rejects(
      () =>
        addItemsToSession(
          "session1",
          { items: [{ productId: "507f1f77bcf86cd799439011", quantity: 1 }] },
          "user1"
        ),
      /Insufficient stock/
    );
  } finally {
    models.Session.findById = originalSessionFindById;
    productService.getProductDocumentOrThrow = originalGetProductDocumentOrThrow;
  }
});

test("addItemsToSession adds item snapshots and updates totals on success", async () => {
  const models = require("../src/models");
  const productService = require("../src/services/product.service");
  const originalSessionFindById = models.Session.findById;
  const originalGetProductDocumentOrThrow = productService.getProductDocumentOrThrow;
  const originalApplyStockMovement = productService.applyStockMovement;
  const stockCalls = [];

  const fakeSession = {
    _id: "session1",
    roomId: "room1",
    reservationId: null,
    customerName: "Somchai",
    customerPhone: "0812345678",
    startTime: new Date("2026-04-21T10:00:00.000Z"),
    endTime: null,
    roomRateSnapshot: { hourlyRate: 300 },
    orderedItems: [],
    itemsSubtotal: 0,
    totalAmount: 0,
    status: "open",
    notes: "",
    openedBy: "user1",
    closedBy: null,
    invoiceId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: async function save() {
      return this;
    }
  };

  models.Session.findById = async () => fakeSession;
  productService.getProductDocumentOrThrow = async () => ({
    _id: "product1",
    name: "Coke",
    price: 35,
    stockQty: 10,
    isActive: true,
    save: async function save() {
      return this;
    }
  });
  productService.applyStockMovement = async (payload) => {
    stockCalls.push(payload);
    return {};
  };

  try {
    const result = await addItemsToSession(
      "session1",
      { items: [{ productId: "507f1f77bcf86cd799439011", quantity: 2 }] },
      "user1"
    );

    assert.equal(fakeSession.orderedItems.length, 1);
    assert.equal(fakeSession.orderedItems[0].productName, "Coke");
    assert.equal(fakeSession.orderedItems[0].unitPrice, 35);
    assert.equal(fakeSession.orderedItems[0].quantity, 2);
    assert.equal(fakeSession.orderedItems[0].lineTotal, 70);
    assert.equal(fakeSession.itemsSubtotal, 70);
    assert.equal(fakeSession.totalAmount, 70);
    assert.equal(stockCalls.length, 1);
    assert.equal(stockCalls[0].movementType, "sale");
    assert.equal(result.totalAmount, 70);
  } finally {
    models.Session.findById = originalSessionFindById;
    productService.getProductDocumentOrThrow = originalGetProductDocumentOrThrow;
    productService.applyStockMovement = originalApplyStockMovement;
  }
});
