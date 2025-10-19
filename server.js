const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Database connection function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Create default admin after successful connection
    await createDefaultAdmin();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  }
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const User = require("./models/User");
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const adminUser = new User({
        name: "System Administrator",
        email: adminEmail,
        password: process.env.DEFAULT_ADMIN_PASSWORD || "admin123",
        status: "admin", // Changed from 'role' to 'status' to match your schema
        isVerified: true,
      });

      await adminUser.save();
      console.log("Default admin user created");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Debug: Check if routes exist before loading
console.log("Loading routes...");

// Routes - with error handling
try {
  app.use("/auth", require("./routes/auth"));
  console.log("✅ Auth routes loaded");
} catch (error) {
  console.error("Error loading auth routes:", error);
}

try {
  app.use("/stats", require("./routes/stats"));
  console.log("✅ Stats routes loaded");
} catch (error) {
  console.error("Error loading stats routes:", error);
}

try {
  app.use("/admin", require("./routes/admin"));
  console.log("✅ Admin routes loaded");
} catch (error) {
  console.error("Error loading admin routes:", error);
}

// ✅ ADDED CONTACT ROUTES
try {
  app.use("/contact", require("./routes/contact"));
  console.log("✅ Contact routes loaded");
} catch (error) {
  console.error("Error loading contact routes:", error);
}
// ✅ ADDED QUESTION ROUTES
try {
  app.use("/questions", require("./routes/question"));
  console.log("✅ Question routes loaded");
} catch (error) {
  console.error("Error loading question routes:", error);
}
// ✅ ADDED BOOKING ROUTES
try {
  app.use("/bookings", require("./routes/booking"));
  console.log("✅ Booking routes loaded");
} catch (error) {
  console.error("Error loading booking routes:", error);
}

// ✅ ADDED PAYMENT ROUTES
try {
  app.use("/payments", require("./routes/payment"));
  console.log("✅ Payment routes loaded");
} catch (error) {
  console.error("Error loading payment routes:", error);
}

// ✅ ADDED VIEWERS ROUTES
try {
  app.use("/views", require("./routes/contentViewRoutes"));
  console.log("✅ Views routes loaded");
} catch (error) {
  console.error("Error loading viewers routes:", error);
}
// ✅ ADDED ORDERS ROUTES
try {
  app.use("/orders", require("./routes/orderRoutes"));
  console.log("✅ Orders routes loaded");
} catch (error) {
  console.error("Error loading orders routes:", error);
}
// ✅ ADDED NOTIFICATION ROUTES
try {
  app.use("/notification", require("./routes/notificationRoutes"));
  console.log("✅ Notification routes loaded");
} catch (error) {
  console.error("Error loading notification routes:", error);
}
// ✅ ADDED PRODUCT-STOCKS ROUTES
try {
  app.use("/products", require("./routes/productRoutes"));
  console.log("✅ Stock Products routes loaded");
} catch (error) {
  console.error("Error loading products routes:", error);
}

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Handle undefined routes (404)
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Initialize server
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();

    // Then start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(
        `✅ Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
