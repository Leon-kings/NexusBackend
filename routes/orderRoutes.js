const express = require("express");
const router = express.Router();
const {
  getSoldProducts,
  getOrderStats,
  getAllOrders,
} = require("../controllers/orderController");

// GET /api/orders/sold-products
router.get("/sold", getSoldProducts);

// GET /api/orders/stats?timeframe=daily|weekly|monthly|yearly
router.get("/stats", getOrderStats);

// GET /api/orders
router.get("/", getAllOrders);

module.exports = router;
