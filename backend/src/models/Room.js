const mongoose = require("mongoose");

const { Schema } = mongoose;

const roomSchema = new Schema(
  {
    // Seed example: { code: "A101", name: "Room A101", type: "standard", capacity: 6, status: "available", hourlyRate: 300 }
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    type: {
      type: String,
      enum: ["standard", "vip"],
      default: "standard",
      required: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    status: {
      type: String,
      enum: ["available", "reserved", "occupied", "cleaning", "maintenance"],
      default: "available",
      required: true
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    currentSessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      default: null
    },
    activeReservationId: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

roomSchema.index({ code: 1 }, { unique: true });
roomSchema.index({ status: 1, isActive: 1 });

module.exports = mongoose.model("Room", roomSchema, "rooms");
