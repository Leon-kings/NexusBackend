// models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'unsubscribed'],
    default: 'active'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date
  },
  source: {
    type: String,
    default: 'website'
  }
}, {
  timestamps: true
});

// Index for better query performance
subscriptionSchema.index({ email: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ subscribedAt: -1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);