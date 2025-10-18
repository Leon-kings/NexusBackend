const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Changed from decoded.userId to decoded.id for consistency
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Check user status - only allow admin, manager, or user
      const allowedStatuses = ["admin", "manager", "user"];
      if (!allowedStatuses.includes(user.status)) {
        return res.status(403).json({
          success: false,
          message: "Your account status is not valid. Please contact support.",
        });
      }

      // Check if email is verified (optional, depending on your requirements)
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email to access this resource",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in authentication",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Middleware to authorize based on status (replaces role-based authorization)
exports.authorize = (...statuses) => {
  return (req, res, next) => {
    if (!statuses.includes(req.user.status)) {
      return res.status(403).json({
        success: false,
        message: `User status ${req.user.status} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Specific status middleware for common use cases
exports.requireAdmin = (req, res, next) => {
  if (req.user.status !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin status required to access this route",
    });
  }
  next();
};

exports.requireManager = (req, res, next) => {
  if (!["manager", "admin"].includes(req.user.status)) {
    return res.status(403).json({
      success: false,
      message: "Manager or Admin status required to access this route",
    });
  }
  next();
};

exports.requireActive = (req, res, next) => {
  if (!["user", "manager", "admin"].includes(req.user.status)) {
    return res.status(403).json({
      success: false,
      message: "Active account required to access this route",
    });
  }
  next();
};

// Middleware to check if user is verified
exports.requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Verified email required to access this route",
    });
  }
  next();
};

// Optional: Middleware for self-or-admin operations
exports.selfOrAdmin = (req, res, next) => {
  const requestedUserId = req.params.id || req.body.userId;

  if (req.user.status !== "admin" && req.user.id !== requestedUserId) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to perform this action",
    });
  }
  next();
};
