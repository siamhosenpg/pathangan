import mongoose from "mongoose";
import Reaction from "../models/reactionModel.js";
import Post from "../models/postmodel.js";
import { Notification } from "../models/notification/notificationmodel.js";
import { createNotification } from "./notification/notificationcontroller.js";
import {
  createActivity,
  deleteActivity,
} from "./activities/activitesController.js";
import { getBlockedUserIds, getBlockRelation } from "../helpers/blockHelper.js"; // path মিলিয়ে নাও

// ===================== TOGGLE LIKE =====================
export const toggleReaction = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Valid postId is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existing = await Reaction.findOne({ userId, postId });

    // ===================== UNLIKE =====================
    // unlike সবসময় করতে দেওয়া হচ্ছে, block থাকলেও (আগের like সরানো যাবে)
    if (existing) {
      await Reaction.deleteOne({ _id: existing._id });

      // 🔻 decrease counter
      await Post.findByIdAndUpdate(postId, {
        $inc: { likesCount: -1 },
      });

      // activity delete
      try {
        await deleteActivity({
          activityId: existing.activityId,
          userId,
        });
      } catch (err) {
        console.error("Activity deletion error:", err);
      }

      // notification delete
      try {
        await Notification.findOneAndDelete({
          actorId: userId,
          type: "like",
          "target.postId": postId,
        });
      } catch (err) {
        console.error("Notification deletion error:", err);
      }

      return res.status(200).json({
        success: true,
        message: "Like removed",
        liked: false,
      });
    }

    // ===================== LIKE =====================

    // ── Block check: পোস্ট ওনারের সাথে block থাকলে like করা যাবে না ──
    const relation = await getBlockRelation(userId, post.userid);
    if (relation.any) {
      return res.status(404).json({ message: "Post not found" });
    }

    const actorId = userId;

    // 1️⃣ create activity
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

    // 2️⃣ create reaction
    const newReaction = await Reaction.create({
      userId,
      postId,
      activityId: activity?._id || null,
    });

    // 🔺 increase counter
    await Post.findByIdAndUpdate(postId, {
      $inc: { likesCount: 1 },
    });

    // 3️⃣ notification
    try {
      await createNotification({
        userId: post.userid,
        actorId,
        type: "like",
        postId: post._id,
      });
    } catch (err) {
      console.error("Notification error:", err);
    }

    return res.status(201).json({
      success: true,
      message: "Liked successfully",
      liked: true,
      reaction: newReaction,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error toggling like",
      error: err.message,
    });
  }
};

// ===================== GET ALL LIKES =====================
export const getReactionsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const blockedIds = await getBlockedUserIds(req.user?.id);

    // পোস্ট ওনার blocked হলে পুরো পোস্টের likes লুকানো
    if (blockedIds.length > 0) {
      const post = await Post.findById(postId).select("userid").lean();
      if (
        post &&
        blockedIds.some((b) => b.toString() === post.userid.toString())
      ) {
        return res.status(404).json({ message: "Post not found" });
      }
    }

    const reactions = await Reaction.find({
      postId,
      ...(blockedIds.length > 0 && { userId: { $nin: blockedIds } }),
    })
      .populate("userId", "name username profileImage")
      .lean();

    return res.status(200).json({
      success: true,
      count: reactions.length,
      reactions,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching likes",
      error: err.message,
    });
  }
};

// ===================== GET LIKE COUNT =====================
export const getReactionCount = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId).select("likesCount");

    return res.status(200).json({
      success: true,
      postId,
      count: post?.likesCount || 0,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching count",
      error: err.message,
    });
  }
};

// ===================== CHECK USER LIKED =====================
export const checkUserLiked = async (req, res) => {
  try {
    const userId = req.user.id;
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
      success: false,
      message: "Error checking like status",
      error: err.message,
    });
  }
};
