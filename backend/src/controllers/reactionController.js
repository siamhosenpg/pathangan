import mongoose from "mongoose";
import Reaction from "../models/reactionModel.js";
import Post from "../models/postmodel.js";
import { createNotification } from "./notification/notificationcontroller.js";
import {
  createActivity,
  deleteActivity,
} from "./activities/activitesController.js";

// 🟢 Create Reaction
export const createReaction = async (req, res) => {
  try {
    const { postId, reaction } = req.body;
    const userId = req.user.id;

    if (!postId || !reaction) {
      return res
        .status(400)
        .json({ message: "postId & reaction are required" });
    }

    // আগেই reaction আছে কিনা চেক করো
    const existing = await Reaction.findOne({ userId, postId });
    if (existing) {
      return res.status(400).json({
        message: "Reaction already exists. Use update API instead.",
      });
    }

    // 🔹 Get post owner
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 🔔 follower user info (actor)
    const actorId = req.user.id;

    // 1️⃣ Create Activity first
    let activity;
    try {
      activity = await createActivity({
        userId: actorId,
        type: "react",
        target: { postId },
      });
    } catch (err) {
      console.error("Activity creation error:", err);
      return res.status(500).json({
        message: "Error creating activity",
        error: err.message,
      });
    }

    // 2️⃣ Create Reaction with activityId
    const newReaction = await Reaction.create({
      userId,
      postId,
      reaction,
      activityId: activity._id, // ✅ Now correct
    });

    // 3️⃣ Send Notification
    try {
      await createNotification({
        userId: post.userid,
        actorId: actorId,
        type: "react",
        postId: postId,
        commentId: null,
      });
    } catch (err) {
      console.error("Notification error:", err);
      // ignore, don't block reaction
    }

    return res.status(201).json({
      message: "Reaction added successfully",
      reaction: newReaction,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error creating reaction",
      error: err.message,
    });
  }
};

// 🟡 Update Reaction
export const updateReaction = async (req, res) => {
  try {
    const { postId, reaction } = req.body;
    const userId = req.user.id;

    if (!postId || !reaction) {
      return res
        .status(400)
        .json({ message: "postId & reaction are required" });
    }

    // আগে reaction থাকা লাগবে
    const existing = await Reaction.findOne({ userId, postId });

    if (!existing) {
      return res.status(404).json({
        message: "Reaction not found. Create reaction first.",
      });
    }

    existing.reaction = reaction;
    await existing.save();

    return res.status(200).json({
      message: "Reaction updated successfully",
      reaction: existing,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error updating reaction",
      error: err.message,
    });
  }
};

// 🔴 Delete Reaction
export const deleteReaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const deleted = await Reaction.findOneAndDelete({ userId, postId });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "No reaction found for this post" });
    }

    try {
      await deleteActivity({ activityId: deleted.activityId, userId });
    } catch (err) {
      console.error("Activity deletion error:", err);
      // ignore, don't block reaction deletion
    }

    return res.status(200).json({
      message: "Reaction removed successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error deleting reaction",
      error: err.message,
    });
  }
};

// 🟣 Get All Reactions of a Post
export const getReactionsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const reactions = await Reaction.find({ postId }).populate(
      "userId",
      "name username profileImage"
    );

    return res.status(200).json({
      count: reactions.length,
      reactions,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching reactions",
      error: err.message,
    });
  }
};

// 🟡 Get Reaction Count Only
export const getReactionCount = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const count = await Reaction.countDocuments({ postId });

    return res.status(200).json({
      success: true,
      postId,
      count,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching reaction count",
      error: err.message,
    });
  }
};

// 🔵 Get Top 3 Reaction Types of a Post
export const getTopReactionsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const postObjectId = new mongoose.Types.ObjectId(postId);

    const topReactions = await Reaction.aggregate([
      { $match: { postId: postObjectId } },
      { $group: { _id: "$reaction", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      { $project: { _id: 0, type: "$_id", count: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      postId,
      topReactions,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching top reactions",
      error: err.message,
    });
  }
};
