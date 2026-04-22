// controllers/followController.js
import Follow from "../models/followModel.js";
import mongoose from "mongoose";

import { createNotification } from "../controllers/notification/notificationcontroller.js";

// 🔹 Follow a user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params; // যাকে follow করা হচ্ছে
    const followerId = req.user.id; // যে follow করছে

    // ❌ নিজেকে follow করা যাবে না
    if (userId === followerId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // ❌ আগেই follow করা আছে কিনা
    const existing = await Follow.findOne({
      followerId,
      followingId: userId,
    });

    if (existing) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // ✅ Follow create
    const follow = await Follow.create({
      followerId,
      followingId: userId,
    });

    // 🔔 follower user info (actor)
    const actorId = req.user.id;

    // 🔔 Create follow notification
    await createNotification({
      userId, // যাকে notification যাবে
      type: "follow",
      actorId, // যে follow করেছে
      // follow হলে postId/commentId লাগে না
    });

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

    const deleted = await Follow.findOneAndDelete({
      followerId,
      followingId: userId,
    });
    if (!deleted) {
      return res
        .status(400)
        .json({ message: "You are not following this user" });
    }

    return res.status(200).json({ message: "User unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get followers of a user
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await Follow.find({ followingId: userId }).populate(
      "followerId",
      "username name"
    );
    return res.status(200).json(followers);
  } catch (err) {
    console.error("Get followers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get following of a user
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await Follow.find({ followerId: userId }).populate(
      "followingId",
      "_id profileImage name bio profilePicture"
    );
    return res.status(200).json(following);
  } catch (err) {
    console.error("Get following error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get Followers Count
export const getFollowersCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Follow.countDocuments({ followingId: userId });

    return res.status(200).json({ followersCount: count });
  } catch (err) {
    console.error("Followers Count Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get Following Count
export const getFollowingCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Follow.countDocuments({ followerId: userId });

    return res.status(200).json({ followingCount: count });
  } catch (err) {
    console.error("Following Count Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
