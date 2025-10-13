const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    name: String,
    option: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    phone: String
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    phone: String
  },
  notes: String,
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  paidAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Find the latest order for today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const lastOrder = await this.constructor.findOne({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });
    
    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `ORD-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  // Calculate items total
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate final total
  this.total = this.subtotal + this.tax + this.shipping - this.discount;
  
  next();
});

// Static method for order statistics
orderSchema.statics.getOrderStats = async function(timeframe = 'daily') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'monthly':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'yearly':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: timeframe === 'daily' ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        orderCount: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  const statusStats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$total' }
      }
    }
  ]);

  const paymentStats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalValue: { $sum: '$total' }
      }
    }
  ]);

  const totalStats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        paidOrders: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
        },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);

  return {
    timeframe,
    periodData: stats,
    byStatus: statusStats,
    byPaymentStatus: paymentStats,
    overview: totalStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      paidOrders: 0,
      pendingOrders: 0
    }
  };
};

module.exports = mongoose.model('Order', orderSchema);