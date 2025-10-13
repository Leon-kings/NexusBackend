const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
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
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [5000, 'Message cannot be more than 5000 characters']
  },
  category: {
    type: String,
    enum: [
      'general',
      'technical',
      'billing',
      'support',
      'feature-request',
      'bug-report',
      'partnership',
      'other'
    ],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'answered', 'closed', 'spam'],
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
  answer: {
    message: String,
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    answeredAt: Date
  },
  source: {
    type: String,
    enum: ['website', 'api', 'admin', 'import'],
    default: 'website'
  },
  tags: [{
    type: String,
    trim: true
  }],
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
  isArchived: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
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
questionSchema.index({ status: 1, createdAt: -1 });
questionSchema.index({ email: 1 });
questionSchema.index({ category: 1 });
questionSchema.index({ priority: 1, createdAt: -1 });

// Update the updatedAt field before saving
questionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get question statistics
questionSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await this.countDocuments();
  const categoryStats = await this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
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

  return {
    total,
    byStatus: stats,
    byCategory: categoryStats,
    byPriority: priorityStats
  };
};

// Method to mark as answered
questionSchema.methods.markAsAnswered = function(answerMessage, userId) {
  this.status = 'answered';
  this.answer = {
    message: answerMessage,
    answeredBy: userId,
    answeredAt: new Date()
  };
};

// Virtual for days since creation
questionSchema.virtual('daysSinceCreation').get(function() {
  const diffTime = Math.abs(new Date() - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Question', questionSchema);