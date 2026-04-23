const mongoose = require("mongoose");

const { Schema } = mongoose;

const stockMovementSchema = new Schema(
  {
    // Seed example: { productId, movementType: "sale", quantity: 2, beforeQty: 20, afterQty: 18, sessionId }
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    movementType: {
      type: String,
      enum: ["stock_in", "sale", "adjustment", "damaged"],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    beforeQty: {
      type: Number,
      required: true,
      min: 0
    },
    afterQty: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ""
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      default: null
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

stockMovementSchema.path("quantity").validate(Number.isInteger, "quantity must be an integer");
stockMovementSchema.path("beforeQty").validate(Number.isInteger, "beforeQty must be an integer");
stockMovementSchema.path("afterQty").validate(Number.isInteger, "afterQty must be an integer");

stockMovementSchema.path("afterQty").validate(function validateStockMovement(value) {
  switch (this.movementType) {
    case "stock_in":
      return value === this.beforeQty + this.quantity;
    case "sale":
    case "damaged":
      return value === this.beforeQty - this.quantity;
    case "adjustment":
      return true;
    default:
      return false;
  }
}, "afterQty does not match movementType and quantity");

stockMovementSchema.index({ productId: 1, createdAt: -1 });
stockMovementSchema.index({ movementType: 1, createdAt: -1 });

module.exports = mongoose.model("StockMovement", stockMovementSchema, "stock_movements");
