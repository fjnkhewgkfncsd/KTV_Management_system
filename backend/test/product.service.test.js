const test = require("node:test");
const assert = require("node:assert/strict");

const { applyStockMovement, buildProductResponse, normalizeProductPayload } = require("../src/services/product.service");

test("normalizeProductPayload trims name and normalizes category", () => {
  const payload = normalizeProductPayload({
    name: " Coca-Cola ",
    category: " DRINK "
  });

  assert.equal(payload.name, "Coca-Cola");
  assert.equal(payload.category, "drink");
});

test("buildProductResponse exposes low stock flag", () => {
  const response = buildProductResponse({
    _id: "6805f0fe7db7a0f4b3d53c10",
    name: "Coca-Cola",
    category: "drink",
    price: 35,
    stockQty: 4,
    lowStockThreshold: 5,
    isActive: true,
    createdAt: new Date("2026-04-21T00:00:00.000Z"),
    updatedAt: new Date("2026-04-21T00:00:00.000Z")
  });

  assert.equal(response.isLowStock, true);
});

test("applyStockMovement deducts stock for sale without going negative", async (t) => {
  const createdMovements = [];
  const fakeProduct = {
    _id: "6805f0fe7db7a0f4b3d53c10",
    stockQty: 10,
    name: "Coca-Cola",
    category: "drink",
    price: 35,
    lowStockThreshold: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: async () => fakeProduct
  };

  const productModel = require("../src/models").Product;
  const stockMovementModel = require("../src/models").StockMovement;
  const originalFindOneAndUpdate = productModel.findOneAndUpdate;
  const originalCreate = stockMovementModel.create;
  t.after(() => {
    productModel.findOneAndUpdate = originalFindOneAndUpdate;
    stockMovementModel.create = originalCreate;
  });

  productModel.findOneAndUpdate = async (_filter, update) => ({
    ...fakeProduct,
    stockQty: fakeProduct.stockQty + update.$inc.stockQty
  });

  stockMovementModel.create = async (payload) => {
    createdMovements.push(payload);
    return { _id: "movement1", createdAt: new Date(), updatedAt: new Date(), ...payload };
  };

  const result = await applyStockMovement({
    product: fakeProduct,
    movementType: "sale",
    quantity: 3,
    reason: "Session item sale",
    createdBy: "user1"
  });

  assert.equal(fakeProduct.stockQty, 7);
  assert.equal(createdMovements.length, 1);
  assert.equal(createdMovements[0].beforeQty, 10);
  assert.equal(createdMovements[0].afterQty, 7);
  assert.equal(result.product.stockQty, 7);
});

test("applyStockMovement blocks negative stock", async () => {
  const fakeProduct = {
    _id: "6805f0fe7db7a0f4b3d53c10",
    stockQty: 2
  };
  const productModel = require("../src/models").Product;
  const originalFindOneAndUpdate = productModel.findOneAndUpdate;

  productModel.findOneAndUpdate = async () => null;

  try {
    await assert.rejects(
      () =>
        applyStockMovement({
          product: fakeProduct,
          movementType: "sale",
          quantity: 3
        }),
      /Stock cannot go below zero/
    );
  } finally {
    productModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
