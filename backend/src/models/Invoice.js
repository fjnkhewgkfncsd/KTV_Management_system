const mongoose = require("mongoose");

const { Schema } = mongoose;

const invoiceLineSchema = new Schema(
  {
    // Example line: { lineType: "product", description: "Coke", quantity: 2, unitPrice: 35, lineTotal: 70 }
    lineType: {
      type: String,
      enum: ["room", "product"],
      required: true
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    code: {
      type: String,
      trim: true,
      maxlength: 50,
      default: ""
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: true
  }
);

const invoiceSchema = new Schema(
  {
    // Seed example: { sessionId, invoiceNumber: "INV-20260421-0001", paymentStatus: "paid", paidAt: new Date(), lines: [...] }
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 50
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "void"],
      default: "unpaid",
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "qr", null],
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    lines: {
      type: [invoiceLineSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Invoice must contain at least one line item"
      },
      required: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    roomCharge: {
      type: Number,
      required: true,
      min: 0
    },
    productCharge: {
      type: Number,
      required: true,
      min: 0
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    taxAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

invoiceSchema.path("paidAt").validate(function validatePaidAt(value) {
  if (this.paymentStatus === "paid") {
    return value instanceof Date;
  }

  return true;
}, "paidAt is required when paymentStatus is PAID");

invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ sessionId: 1 }, { unique: true });
invoiceSchema.index({ paymentStatus: 1, paidAt: -1 });

module.exports = mongoose.model("Invoice", invoiceSchema, "invoices");
