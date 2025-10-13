const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot be more than 100 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, "Phone number cannot be more than 20 characters"],
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, "Company name cannot be more than 100 characters"],
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
    maxlength: [200, "Subject cannot be more than 200 characters"],
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    maxlength: [5000, "Message cannot be more than 5000 characters"],
  },
  interest: {
    type: String,
    enum: [
      "general",
      "ecommerce",
      "consulting",
      "partnership",
      "career",
      "other",
    ],
    default: "general",
  },
  budget: {
    type: String,
    enum: [
      "500-1000",
      "1000-5000",
      "5000-10000",
      "10000-25000",
      "25000-50000",
      "50000+",
      "not-specified",
    ],
    default: "500-1000",
  },
  status: {
    type: String,
    enum: ["new", "in-progress", "responded", "resolved", "spam"],
    default: "new",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  response: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    respondedAt: Date,
  },
  source: {
    type: String,
    enum: ["website", "api", "admin", "import"],
    default: "website",
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  notes: [
    {
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  isArchived: {
    type: Boolean,
    default: false,
  },
  followUpDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better query performance
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });
contactSchema.index({ assignedTo: 1 });
contactSchema.index({ priority: 1, createdAt: -1 });

// Update the updatedAt field before saving
contactSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get contact statistics
contactSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await this.countDocuments();
  const priorityStats = await this.aggregate([
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  const interestStats = await this.aggregate([
    {
      $group: {
        _id: "$interest",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    total,
    byStatus: stats,
    byPriority: priorityStats,
    byInterest: interestStats,
  };
};

// Method to mark as responded
contactSchema.methods.markAsResponded = function (responseMessage, userId) {
  this.status = "responded";
  this.response = {
    message: responseMessage,
    respondedBy: userId,
    respondedAt: new Date(),
  };
};

// Virtual for days since creation
contactSchema.virtual("daysSinceCreation").get(function () {
  const diffTime = Math.abs(new Date() - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model("Contact", contactSchema);
