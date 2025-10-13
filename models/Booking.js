const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: [
      'web-development',
      'mobile-app',
      'ecommerce',
      'ui-ux-design',
      'digital-marketing',
      'seo',
      'consulting',
      'maintenance',
      'other'
    ]
  },
  budget: {
    type: String,
    required: [true, 'Budget is required'],
    enum: [
      '1000-5000',
      '5000-10000',
      '10000-25000',
      '25000-50000',
      '50000-100000',
      '100000+',
      'not-specified'
    ],
    default: 'not-specified'
  },
  timeline: {
    type: String,
    required: [true, 'Timeline is required'],
    enum: [
      'immediate',
      '2-weeks',
      '1-month',
      '2-3-months',
      '3-6-months',
      '6-months-plus',
      'flexible'
    ],
    default: 'flexible'
  },
  requirements: {
    type: String,
    required: [true, 'Requirements are required'],
    trim: true,
    maxlength: [5000, 'Requirements cannot be more than 5000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'quoted', 'negotiation', 'won', 'lost', 'cancelled'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  estimatedValue: {
    type: Number,
    min: 0
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  nextFollowUp: Date,
  notes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    filename: String,
    originalName: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  source: {
    type: String,
    enum: ['website', 'referral', 'social-media', 'email', 'phone', 'other'],
    default: 'website'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  meetingScheduled: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ serviceType: 1 });
bookingSchema.index({ priority: 1, createdAt: -1 });
bookingSchema.index({ assignedTo: 1 });
bookingSchema.index({ estimatedValue: -1 });

// Update the updatedAt field before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get booking statistics
bookingSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$estimatedValue' }
      }
    }
  ]);

  const total = await this.countDocuments();
  const serviceStats = await this.aggregate([
    {
      $group: {
        _id: '$serviceType',
        count: { $sum: 1 },
        totalValue: { $sum: '$estimatedValue' }
      }
    }
  ]);

  const priorityStats = await this.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalValue = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$estimatedValue' }
      }
    }
  ]);

  return {
    total,
    totalValue: totalValue[0]?.total || 0,
    byStatus: stats,
    byService: serviceStats,
    byPriority: priorityStats
  };
};

// Method to calculate probability based on status
bookingSchema.methods.calculateProbability = function() {
  const probabilityMap = {
    'new': 10,
    'contacted': 25,
    'quoted': 50,
    'negotiation': 75,
    'won': 100,
    'lost': 0,
    'cancelled': 0
  };
  
  this.probability = probabilityMap[this.status] || 0;
  return this.probability;
};

// Virtual for days since creation
bookingSchema.virtual('daysSinceCreation').get(function() {
  const diffTime = Math.abs(new Date() - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for estimated completion date
bookingSchema.virtual('estimatedCompletion').get(function() {
  if (!this.meetingScheduled) return null;
  
  const timelineDays = {
    'immediate': 7,
    '2-weeks': 14,
    '1-month': 30,
    '2-3-months': 75,
    '3-6-months': 135,
    '6-months-plus': 180
  };
  
  const days = timelineDays[this.timeline] || 30;
  const completionDate = new Date(this.meetingScheduled);
  completionDate.setDate(completionDate.getDate() + days);
  return completionDate;
});

module.exports = mongoose.model('Booking', bookingSchema);