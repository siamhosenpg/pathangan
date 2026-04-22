import { Activity } from "../../models/activities/acitiviteModel.js";

/**
 * ✅ CREATE ACTIVITY
 * Used when user reacts / comments / follows
 */
export const createActivity = async ({ userId, type, target }) => {
  try {
    const activity = new Activity({
      userId,
      type,
      target,
    });

    await activity.save();
    return activity;
  } catch (error) {
    console.error("Error creating activity:", error);
    throw error;
  }
};

/**
 * ✅ GET LOGIN USER ACTIVITIES
 * GET /api/activities
 * Protected Route
 */
export const getUserActivities = async (req, res, next) => {
  try {
    // 🔐 login করা user এর id (protect middleware থেকে)
    const userId = req.user.id || req.user._id;

    // 📄 pagination
    const limit = Math.max(Number(req.query.limit) || 20, 1);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    // 🔍 DB Query
    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 }) // newest first
      .limit(limit)
      .skip(skip)
      .populate("target.postId", "title content")
      .populate("target.commentId", "content")
      .populate("target.followId", "name username profileImage userid");

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching user activities:", error);
    next(error);
  }
};

/**
 * ✅ DELETE ACTIVITY (Service Function)
 * Can be called from any controller
 */
export const deleteActivity = async ({ activityId, userId }) => {
  try {
    // 🔍 activity খুঁজে বের করো
    const activity = await Activity.findById(activityId);

    if (!activity) {
      return null; // caller বুঝবে activity নাই
    }

    // 🔐 ownership check
    if (activity.userId.toString() !== userId.toString()) {
      const error = new Error("Not authorized to delete this activity");
      error.statusCode = 403;
      throw error;
    }

    await activity.deleteOne();
    return activity;
  } catch (error) {
    console.error("Error deleting activity:", error);
    throw error;
  }
};

export const getLastFourUserActivities = async (req, res, next) => {
  try {
    // 🔐 login করা user এর id
    const userId = req.user.id || req.user._id;

    // 🔍 DB Query → শুধু শেষের ৪টা activity
    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 }) // newest first
      .limit(4)
      .populate("target.postId", "title content")
      .populate("target.commentId", "content")
      .populate("target.followId", "name username profileImage userid");

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching last 4 user activities:", error);
    next(error);
  }
};
