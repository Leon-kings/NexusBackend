const Order = require("../models/Order");
const Product = require("../models/Product");

// ✅ Create new order and update stock
exports.createOrder = async (req, res) => {
  try {
    const { user, items, totalAmount, paymentStatus, status, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items in order." });
    }

    // Check stock availability before creating order
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product: ${product.name}`,
        });
      }
    }

    // Deduct stock after all checks
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    }

    // Create order
    const newOrder = await Order.create({
      user,
      items,
      totalAmount,
      paymentStatus: paymentStatus || "pending",
      status: status || "processing",
      shippingAddress,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully and stock updated.",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Failed to create order", error: error.message });
  }
};

// ✅ Get all orders
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

// ✅ Get sold products summary
exports.getSoldProducts = async (req, res) => {
  try {
    const soldProducts = await Order.aggregate([
      { $unwind: "$items" },
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
      { $sort: { totalQuantity: -1 } },
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

// ✅ Get order stats (daily, weekly, monthly)
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
