import Reaction from "../models/reactionModel.js";
import Post from "../models/postmodel.js";
import { createNotification } from "./notification/notificationcontroller.js";
import {
  createActivity,
  deleteActivity,
} from "./activities/activitesController.js";

// 🟢 Toggle Like (Create OR Remove)
export const toggleReaction = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    // 🔍 check existing like
    const existing = await Reaction.findOne({ userId, postId });

    // ❌ যদি already like থাকে → unlike (delete)
    if (existing) {
      await Reaction.deleteOne({ _id: existing._id });

      try {
        await deleteActivity({ activityId: existing.activityId, userId });
      } catch (err) {
        console.error("Activity deletion error:", err);
      }

      return res.status(200).json({
        message: "Like removed",
        liked: false,
      });
    }

    // 🔹 post check
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const actorId = userId;

    // 1️⃣ Activity create (optional রাখতে পারো)
    let activity = null;
    try {
      activity = await createActivity({
        userId: actorId,
        type: "like",
        target: { postId },
      });
    } catch (err) {
      console.error("Activity error:", err);
    }

    // 2️⃣ Create Like
    const newReaction = await Reaction.create({
      userId,
      postId,
      activityId: activity?._id || null, // যদি না লাগে remove করে দাও
    });

    // 3️⃣ Notification
    try {
      await createNotification({
        userId: post.userid,
        actorId,
        type: "like",
        postId,
      });
    } catch (err) {
      console.error("Notification error:", err);
    }

    return res.status(201).json({
      message: "Liked successfully",
      liked: true,
      reaction: newReaction,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error toggling like",
      error: err.message,
    });
  }
};

// 🟣 Get all likes of a post
export const getReactionsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const reactions = await Reaction.find({ postId }).populate(
      "userId",
      "name username profileImage",
    );

    return res.status(200).json({
      count: reactions.length,
      reactions,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching likes",
      error: err.message,
    });
  }
};

// 🟡 Count only
export const getReactionCount = async (req, res) => {
  try {
    const { postId } = req.params;

    const count = await Reaction.countDocuments({ postId });

    return res.status(200).json({
      success: true,
      postId,
      count,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching count",
      error: err.message,
    });
  }
};
export const checkUserLiked = async (req, res) => {
  try {
    const userId = req.user.id; // protect middleware থেকে আসবে
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const exists = await Reaction.findOne({ userId, postId });

    return res.status(200).json({
      success: true,
      liked: !!exists,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error checking like status",
      error: err.message,
    });
  }
};
