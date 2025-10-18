const ContentView = require("../models/contentViewModel");
const User = require("../models/User");

// Record a content view
exports.recordView = async (req, res) => {
  try {
    const userId = req.body.userId || null;
    const fingerprint = req.body.fingerprint || null;
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Check if this viewer (user or guest) already viewed
    const existingView = await ContentView.findOne({
      $or: [
        { userId: userId || undefined },
        { ipAddress: ipAddress },
        { fingerprint: fingerprint },
      ],
    });

    if (existingView) {
      return res.status(200).json({
        success: true,
        message: "View already counted for this visitor",
      });
    }

    // Save new view
    await ContentView.create({
      userId,
      ipAddress,
      fingerprint,
    });

    res.status(201).json({
      success: true,
      message: "Home content view recorded successfully ✅",
    });
  } catch (error) {
    console.error("Error recording view:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get total statistics
exports.getStats = async (req, res) => {
  try {
    const totalViews = await ContentView.countDocuments();
    const uniqueUsers = await ContentView.countDocuments({ userId: { $ne: null } });
    const guestViews = await ContentView.countDocuments({ userId: null });

    const recentViews = await ContentView.find()
      .sort({ viewedAt: -1 })
      .limit(10)
      .select("ipAddress userId viewedAt");

    res.status(200).json({
      success: true,
      data: {
        totalViews,
        uniqueUsers,
        guestViews,
        recentViews,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
