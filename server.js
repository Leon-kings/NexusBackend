const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
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
    process.exit(1);
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
        status: "admin",
        isVerified: true,
      });

      await adminUser.save();
      console.log("✅ Default admin user created");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error creating default admin:", error);
  }
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 150 * 60 * 1000,
  max: 10000,
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

// Enhanced route loader with better error handling
const loadRoute = (routePath, routeName, basePath = "/") => {
  try {
    const fullPath = path.resolve(__dirname, routePath);

    // Check if file exists
    if (!fs.existsSync(fullPath + ".js")) {
      console.log(`❌ ${routeName} route file not found: ${routePath}.js`);
      return false;
    }

    const routeModule = require(routePath);

    if (routeModule && typeof routeModule === "function") {
      app.use(basePath, routeModule);
      console.log(`✅ ${routeName} routes loaded at ${basePath}`);
      return true;
    } else {
      console.log(`❌ ${routeName} route module is not a valid router`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error loading ${routeName} routes:`, error.message);
    return false;
  }
};

// Load all routes with enhanced error handling
console.log("🔄 Loading routes...");

// Based on your file structure, use these exact file names:
const routes = [
  { path: "./routes/auth", name: "Auth", base: "/auth" },
  { path: "./routes/stats", name: "Stats", base: "/stats" },
  { path: "./routes/admin", name: "Admin", base: "/admin" },
  { path: "./routes/contact", name: "Contact", base: "/contact" },
  { path: "./routes/question", name: "Question", base: "/questions" },
  { path: "./routes/booking", name: "Booking", base: "/bookings" },
  { path: "./routes/payment", name: "Payment", base: "/payments" },
  { path: "./routes/contentViewRoutes", name: "Views", base: "/views" },
  { path: "./routes/orderRoutes", name: "Orders", base: "/orders" },
  {
    path: "./routes/notificationRoutes",
    name: "Notification",
    base: "/notification",
  },
  { path: "./routes/productRoutes", name: "Products", base: "/products" },
  {
    path: "./routes/testimonialRoutes",
    name: "Testimony",
    base: "/testimonials",
  },
  {
    path: "./routes/subscriptionRoutes",
    name: "Subscription",
    base: "/subscription",
  },
];

let loadedRoutes = 0;
routes.forEach((route) => {
  if (loadRoute(route.path, route.name, route.base)) {
    loadedRoutes++;
  }
});

console.log(`📊 Routes loaded: ${loadedRoutes}/${routes.length}`);

// Test endpoints for each route (optional - for debugging)
app.get("/auth/test", (req, res) => res.json({ message: "Auth route works" }));
app.get("/stats/test", (req, res) =>
  res.json({ message: "Stats route works" })
);
app.get("/admin/test", (req, res) =>
  res.json({ message: "Admin route works" })
);
app.get("/contact/test", (req, res) =>
  res.json({ message: "Contact route works" })
);
app.get("/questions/test", (req, res) =>
  res.json({ message: "Questions route works" })
);
app.get("/bookings/test", (req, res) =>
  res.json({ message: "Bookings route works" })
);
app.get("/payments/test", (req, res) =>
  res.json({ message: "Payments route works" })
);
app.get("/views/test", (req, res) =>
  res.json({ message: "Views route works" })
);
app.get("/orders/test", (req, res) =>
  res.json({ message: "Orders route works" })
);
app.get("/notification/test", (req, res) =>
  res.json({ message: "Notification route works" })
);
app.get("/products/test", (req, res) =>
  res.json({ message: "Products route works" })
);
app.get("/subscription/test", (req, res) =>
  res.json({ message: "Subscription route works" })
);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    routes_loaded: loadedRoutes,
    total_routes: routes.length,
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully",
    timestamp: new Date().toISOString(),
    available_routes: routes.map((r) => r.base),
    health_check: "/health",
  });
});

// ✅ CORRECTED 404 Handler - FIXED THE SYNTAX ERROR
app.use((req, res, next) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    requested_url: req.originalUrl,
    method: req.method,
    available_routes: routes.map((r) => r.base),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🚨 Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong!",
  });
});

// Initialize server
const startServer = async () => {
  try {
    console.log("🔄 Starting server initialization...");

    // Connect to database first
    await connectDB();

    // Then start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log("\n" + "=".repeat(50));
      console.log(`🚀 Server started successfully!`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📊 Routes loaded: ${loadedRoutes}/${routes.length}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log("=".repeat(50) + "\n");
    });
  } catch (error) {
    console.error("💥 Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
