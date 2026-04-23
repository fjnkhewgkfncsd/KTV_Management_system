const mongoose = require("mongoose");

const { Schema } = mongoose;

const sessionRoomSnapshotSchema = new Schema(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },
    code: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["standard", "vip"],
      required: true
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const sessionProductSnapshotSchema = new Schema(
  {
    // Example line: { productId, productName: "Coke", unitPrice: 35, quantity: 2, lineTotal: 70 }
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);

const sessionSchema = new Schema(
  {
    // Seed example: { roomId, customerName: "Somchai", startTime: new Date(), roomRateSnapshot: { ... }, orderedItems: [] }
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      default: null
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    customerPhone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: ""
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      required: true
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true
    },
    endTime: {
      type: Date,
      default: null
    },
    roomRateSnapshot: {
      type: sessionRoomSnapshotSchema,
      required: true
    },
    orderedItems: {
      type: [sessionProductSnapshotSchema],
      default: []
    },
    itemsSubtotal: {
      type: Number,
      min: 0,
      default: 0
    },
    totalAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    openedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

sessionSchema.path("endTime").validate(function validateEndTime(value) {
  if (!value) {
    return true;
  }

  return value >= this.startTime;
}, "endTime must be later than or equal to startTime");

sessionSchema.index(
  { roomId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "open" }
  }
);
sessionSchema.index({ reservationId: 1 }, { sparse: true });
sessionSchema.index({ status: 1, startTime: -1 });

module.exports = mongoose.model("Session", sessionSchema, "sessions");
