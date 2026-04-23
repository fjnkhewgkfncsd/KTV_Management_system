const mongoose = require("mongoose");

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    // Seed example: { name: "Coca-Cola 330ml", category: "drink", price: 35, stockQty: 120, lowStockThreshold: 10 }
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    category: {
      type: String,
      enum: ["drink", "food", "snack", "other"],
      default: "other",
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    stockQty: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

productSchema.path("stockQty").validate(Number.isInteger, "stockQty must be an integer");
productSchema.path("lowStockThreshold").validate(Number.isInteger, "lowStockThreshold must be an integer");

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1, stockQty: 1, lowStockThreshold: 1 });

module.exports = mongoose.model("Product", productSchema, "products");
