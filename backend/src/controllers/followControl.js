import Follow from "../models/followModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import { createNotification } from "../controllers/notification/notificationcontroller.js";

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

    // ✅ counter update
    await User.findByIdAndUpdate(userId, {
      $inc: { "activityStats.totalFollowers": 1 },
    });
    await User.findByIdAndUpdate(followerId, {
      $inc: { "activityStats.totalFollowing": 1 },
    });

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

    // ✅ counter update
    await User.findByIdAndUpdate(userId, {
      $inc: { "activityStats.totalFollowers": -1 },
    });
    await User.findByIdAndUpdate(followerId, {
      $inc: { "activityStats.totalFollowing": -1 },
    });

    return res
      .status(200)
      .json({ success: true, message: "User unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get followers of a user
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const followers = await Follow.find({ followingId: userId })
      .populate("followerId", "name username profileImage")
      .lean();

    return res
      .status(200)
      .json({ success: true, count: followers.length, followers });
  } catch (err) {
    console.error("Get followers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get following of a user
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const following = await Follow.find({ followerId: userId })
      .populate("followingId", "name username profileImage bio")
      .lean();

    return res
      .status(200)
      .json({ success: true, count: following.length, following });
  } catch (err) {
    console.error("Get following error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get followers count — activityStats থেকে, extra query নেই
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

// 🔹 Get following count — activityStats থেকে, extra query নেই
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
