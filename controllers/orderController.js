const Order = require("../models/Order");
const Product = require("../models/Product");

exports.getSoldProducts = async (req, res) => {
  try {
    // Aggregate product sales info
    const soldProducts = await Order.aggregate([
      { $unwind: "$items" }, // deconstruct items array
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$productInfo.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" },
          avgPrice: { $avg: "$items.price" },
        },
      },
      { $sort: { totalQuantity: -1 } }, // most sold first
    ]);

    res.status(200).json({
      success: true,
      count: soldProducts.length,
      soldProducts,
    });
  } catch (error) {
    console.error("Error fetching sold products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sold products",
      error: error.message,
    });
  }
};


exports.getOrderStats = async (req, res) => {
  try {
    const { timeframe = "daily" } = req.query;
    const stats = await Order.getOrderStats(timeframe);
    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: error.message,
    });
  }
};


exports.getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, user } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (user) filter.user = user;

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};
