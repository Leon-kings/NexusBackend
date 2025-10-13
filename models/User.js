const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot be more than 100 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  status: {
    type: String,
    enum: ["user", "admin", "moderator"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  loginCount: {
    type: Number,
    default: 0,
  },
  lastLogin: Date,
  profile: {
    avatar: {
      type: String,
      default: null
    },
    phone: {
      type: String,
      default: null
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate verification code
userSchema.methods.generateVerificationCode = function () {
  this.verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  this.verificationCodeExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return this.verificationCode;
};

// Check if user is admin
userSchema.methods.isAdmin = function () {
  return this.status === "admin";
};

// Check if user is moderator or admin
userSchema.methods.isModerator = function () {
  return this.status === "moderator" || this.status === "admin";
};

// To JSON transform
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.verificationCode;
  delete user.verificationCodeExpires;
  return user;
};

module.exports = mongoose.model("User", userSchema);