import express from "express";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  deleteAllNotifications,
} from "../../controllers/notification/notificationcontroller.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

// 🔔 Get notifications
router.get("/", protect, getMyNotifications);
router.get("/unread-count", protect, getUnreadNotificationCount);

// 🔔 Bulk actions — /:id এর আগে রাখতে হবে
router.patch("/read-all", protect, markAllAsRead);
router.delete("/delete-all", protect, deleteAllNotifications);

// 🔔 Single notification — সবার শেষে
router.patch("/:id/read", protect, markAsRead);
router.delete("/:id", protect, deleteNotification);

export default router;
