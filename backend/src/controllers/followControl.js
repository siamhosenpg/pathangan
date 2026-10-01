import Follow from "../models/followModel.js";
import User from "../models/usermodel.js";
import mongoose from "mongoose";
import { createNotification } from "../controllers/notification/notificationcontroller.js";
import { Notification } from "../models/notification/notificationmodel.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// 🔹 Helper: limit ar cursor parse kora
const parsePagination = (query) => {
  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const cursor = query.cursor || null;
  const cursorValid = !cursor || mongoose.Types.ObjectId.isValid(cursor);

  return { limit, cursor, cursorValid };
};

// 🔹 Follow a user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (userId === followerId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const existing = await Follow.findOne({ followerId, followingId: userId });
    if (existing) {
      return res.status(400).json({ message: "Already following this user" });
    }

    const follow = await Follow.create({ followerId, followingId: userId });

    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $inc: { "activityStats.totalFollowers": 1 },
      }),
      User.findByIdAndUpdate(followerId, {
        $inc: { "activityStats.totalFollowing": 1 },
      }),
    ]);

    try {
      await createNotification({
        userId,
        type: "follow",
        actorId: followerId,
      });
    } catch (err) {
      console.error("Follow notification error:", err);
    }

    return res.status(201).json({
      success: true,
      message: "User followed successfully",
      follow,
    });
  } catch (err) {
    console.error("Follow error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const deleted = await Follow.findOneAndDelete({
      followerId,
      followingId: userId,
    });

    if (!deleted) {
      return res
        .status(400)
        .json({ message: "You are not following this user" });
    }

    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $inc: { "activityStats.totalFollowers": -1 },
      }),
      User.findByIdAndUpdate(followerId, {
        $inc: { "activityStats.totalFollowing": -1 },
      }),
    ]);

    // ✅ Unfollow korle follow notification remove koro
    try {
      await Notification.deleteOne({
        userId,
        actorId: followerId,
        type: "follow",
      });
    } catch (err) {
      console.error("Unfollow notification delete error:", err);
    }

    return res
      .status(200)
      .json({ success: true, message: "User unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get followers of a user (infinite scroll)
// GET /followers/:userId?limit=20&cursor=<lastId>
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { limit, cursor, cursorValid } = parsePagination(req.query);
    if (!cursorValid) {
      return res.status(400).json({ message: "Invalid cursor" });
    }

    const filter = { followingId: userId };
    if (cursor) filter._id = { $lt: cursor };

    // limit + 1 anchi jate bujhte pari aro data ache kina
    const docs = await Follow.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("followerId", "name username profileImage")
      .lean();

    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor =
      hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1]._id : null;

    // deleted user thakle populate null hobe, seta filter kore dilam
    const followers = pageDocs.filter((f) => f.followerId);

    return res.status(200).json({
      success: true,
      count: followers.length,
      followers,
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error("Get followers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get following of a user (infinite scroll)
// GET /following/:userId?limit=20&cursor=<lastId>
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { limit, cursor, cursorValid } = parsePagination(req.query);
    if (!cursorValid) {
      return res.status(400).json({ message: "Invalid cursor" });
    }

    const filter = { followerId: userId };
    if (cursor) filter._id = { $lt: cursor };

    const docs = await Follow.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("followingId", "name username profileImage bio")
      .lean();

    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor =
      hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1]._id : null;

    const following = pageDocs.filter((f) => f.followingId);

    return res.status(200).json({
      success: true,
      count: following.length,
      following,
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error("Get following error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get followers count
export const getFollowersCount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId)
      .select("activityStats.totalFollowers")
      .lean();

    return res.status(200).json({
      success: true,
      followersCount: user?.activityStats?.totalFollowers || 0,
    });
  } catch (err) {
    console.error("Followers count error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get following count
export const getFollowingCount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId)
      .select("activityStats.totalFollowing")
      .lean();

    return res.status(200).json({
      success: true,
      followingCount: user?.activityStats?.totalFollowing || 0,
    });
  } catch (err) {
    console.error("Following count error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Check if following
export const checkIsFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const exists = await Follow.findOne({ followerId, followingId: userId });
    return res.status(200).json({ success: true, isFollowing: !!exists });
  } catch (err) {
    console.error("Check following error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
