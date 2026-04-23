const mongoose = require("mongoose");

const { Schema } = mongoose;

const reservationRoomSnapshotSchema = new Schema(
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

const reservationSchema = new Schema(
  {
    // Seed example: { roomId, customerName: "Somchai", customerPhone: "0812345678", reservedStartTime, expectedDuration: 120, depositAmount: 500, status: "confirmed" }
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    reservedStartTime: {
      type: Date,
      required: true
    },
    expectedDuration: {
      type: Number,
      required: true,
      min: 1
    },
    depositAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "checked_in"],
      default: "pending",
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    roomSnapshot: {
      type: reservationRoomSnapshotSchema,
      required: true
    },
    reservedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    checkedInAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

reservationSchema.virtual("reservedEndTime").get(function getReservedEndTime() {
  if (!this.reservedStartTime || !this.expectedDuration) {
    return null;
  }

  return new Date(this.reservedStartTime.getTime() + this.expectedDuration * 60 * 1000);
});

reservationSchema.path("expectedDuration").validate(
  Number.isInteger,
  "expectedDuration must be an integer number of minutes"
);

reservationSchema.index({ roomId: 1, reservedStartTime: 1, status: 1 });
reservationSchema.index({ status: 1, reservedStartTime: 1 });

module.exports = mongoose.model("Reservation", reservationSchema, "reservations");
