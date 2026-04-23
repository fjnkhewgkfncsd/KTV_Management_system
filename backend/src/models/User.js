const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    // Seed example: { username: "reception01", passwordHash: "...", name: "Front Desk A", role: "RECEPTIONIST" }
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 20
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    role: {
      type: String,
      enum: ["admin", "receptionist"],
      default: "receptionist",
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema, "users");
