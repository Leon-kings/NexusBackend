const Notification = require("../models/Notification");

// ✅ Create a notification
exports.createNotification = async (type, message, relatedId) => {
  try {
    const notification = await Notification.create({ type, message, relatedId });
    console.log("Notification created:", notification.message);
  } catch (err) {
    console.error("Error creating notification:", err);
  }
};

// ✅ Get all notifications (optionally unread only)
exports.getNotifications = async (req, res) => {
  try {
    const showUnread = req.query.unread === "true";
    const filter = showUnread ? { isRead: false } : {};

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ Mark one as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating", error: err.message });
  }
};

// ✅ Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating", error: err.message });
  }
};
