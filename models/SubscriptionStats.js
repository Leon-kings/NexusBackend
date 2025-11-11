// models/SubscriptionStats.js
const mongoose = require('mongoose');

const subscriptionStatsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  totalSubscriptions: {
    type: Number,
    default: 0
  },
  newSubscriptions: {
    type: Number,
    default: 0
  },
  unsubscriptions: {
    type: Number,
    default: 0
  },
  activeSubscriptions: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

subscriptionStatsSchema.index({ date: 1 });

module.exports = mongoose.model('SubscriptionStats', subscriptionStatsSchema);