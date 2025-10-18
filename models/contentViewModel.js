const mongoose = require("mongoose");

const contentViewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // For guests
    ipAddress: {
      type: String,
      default: null,
    },
    // Optional device fingerprint or cookie ID
    fingerprint: {
      type: String,
      default: null,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicates (same IP or same user)
contentViewSchema.index({ userId: 1, ipAddress: 1, fingerprint: 1 }, { unique: true });

module.exports = mongoose.model("ContentView", contentViewSchema);
