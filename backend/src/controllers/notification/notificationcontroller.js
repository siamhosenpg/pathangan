import mongoose from "mongoose";
import { Notification } from "../../models/notification/notificationmodel.js";

/**
 * 🔔 Create Notification
 * (like / comment / follow / share)
 */
export const createNotification = async ({
  userId,
  type,
  actorId,
  postId = null,
  commentId = null,
}) => {
  // ❌ নিজেকে নিজে notification না
  if (userId.toString() === actorId.toString()) return;

  await Notification.create({
    userId,
    type,
    actorId,
    target: {
      postId,
      commentId,
    },
  });
};

/**
 * 🔔 Get logged-in user's notifications
 */
export const getMyNotifications = async (req, res) => {
  try {
    const { cursor, limit = 10 } = req.query;

    const query = { userId: req.user.id };

    if (cursor) {
      // ✅ string কে ObjectId এ convert করতে হবে
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const notifications = await Notification.find(query)
      .populate("actorId", "name username profileImage userid gender")
      .populate("userId", "name username profileImage userid gender")
      .sort({ _id: -1 })
      .limit(Number(limit) + 1);

    const hasMore = notifications.length > Number(limit);
    if (hasMore) notifications.pop();

    const nextCursor = hasMore
      ? notifications[notifications.length - 1]._id
      : null;

    res.status(200).json({
      success: true,
      notifications,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * 🔔 Mark single notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { read: true },
    );

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 🔔 Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 🔔 Count unread notifications
 * Returns number of notifications with read: false for logged-in user
 */
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
    });

    res.status(200).json({
      success: true,
      count, // number of unread notifications
    });
  } catch (error) {
    console.error("getUnreadNotificationCount error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 🔔 Delete a notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
