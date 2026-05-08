import mongoose from "mongoose";
import { Notification } from "../../models/notification/notificationmodel.js";

/**
 * 🔔 Create Notification — internal service function
 * type: "like" | "comment" | "follow" | "share"
 */
export const createNotification = async ({
  userId,
  type,
  actorId,
  postId = null,
  commentId = null,
}) => {
  try {
    // নিজেকে নিজে notification না
    if (userId.toString() === actorId.toString()) return;

    // duplicate check — same actor, same type, same target (1 ঘণ্টার মধ্যে)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const duplicate = await Notification.findOne({
      userId,
      actorId,
      type,
      "target.postId": postId,
      "target.commentId": commentId,
      createdAt: { $gte: oneHourAgo },
    });

    if (duplicate) return;

    await Notification.create({
      userId,
      type,
      actorId,
      target: { postId, commentId },
    });
  } catch (error) {
    console.error("createNotification error:", error);
  }
};

/**
 * GET /api/notifications
 * 🔔 Login user এর সব notification (cursor-based pagination)
 */
export const getMyNotifications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const cursor = req.query.cursor;

    const query = { userId: req.user.id };

    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid cursor" });
      }
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const notifications = await Notification.find(query)
      .populate("actorId", "name username profileImage gender")
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    const nextCursor = hasMore
      ? notifications[notifications.length - 1]._id
      : null;

    return res.status(200).json({
      success: true,
      notifications,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("getMyNotifications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * 🔔 Single notification read mark
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification id" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("markAsRead error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/notifications/read-all
 * 🔔 সব notification read mark
 */
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true },
    );

    return res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/notifications/unread-count
 * 🔔 Unread notification count
 */
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
    });

    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("getUnreadNotificationCount error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/notifications/:id
 * 🔔 Single notification delete
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification id" });
    }

    // ownership check
    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("deleteNotification error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/notifications
 * 🔔 সব notification delete
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });

    return res
      .status(200)
      .json({ success: true, message: "All notifications deleted" });
  } catch (error) {
    console.error("deleteAllNotifications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
