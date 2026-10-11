import mongoose from "mongoose";
import Comment from "../models/commentsModel.js";
import Post from "../models/postmodel.js";
import { createNotification } from "./notification/notificationcontroller.js";
import { Notification } from "../models/notification/notificationmodel.js";

const USER_FIELDS =
  "name userid profileImage gender username badges greenmarkVerified";
const MENTION_FIELDS = "name username";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ===============================
// HELPER — postType check
// ===============================
const isAllowedPostType = async (postId) => {
  const post = await Post.findById(postId).select("postType");
  if (!post) return false;
  return post.postType === "post" || post.postType === "course";
};

// ===============================
// GET COMMENTS COUNT
// ===============================
export const getCommentsCount = async (req, res) => {
  try {
    const { postId } = req.params;
    const count = await Comment.countDocuments({
      postId,
      parentCommentId: null,
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// CREATE COMMENT / REPLY
// ===============================
export const createComment = async (req, res) => {
  try {
    const { postId, text, parentCommentId } = req.body;

    if (!postId || !isValidId(postId)) {
      return res.status(400).json({ message: "Valid postId is required" });
    }

    if (!text?.trim()) {
      return res.status(400).json({ message: "text is required" });
    }

    const allowed = await isAllowedPostType(postId);
    if (!allowed) {
      return res.status(403).json({
        message: "Comments are only allowed on post and course type posts",
      });
    }

    // ===== reply হলে: সবসময় root comment এর নিচে বসাবো (২ লেভেল) =====
    let rootParentId = null;
    let replyToUserId = null;

    if (parentCommentId) {
      if (!isValidId(parentCommentId)) {
        return res.status(400).json({ message: "Invalid parentCommentId" });
      }

      const target = await Comment.findById(parentCommentId).select(
        "postId parentCommentId commentUserId",
      );

      if (!target || String(target.postId) !== String(postId)) {
        return res.status(404).json({ message: "Parent comment not found" });
      }

      // target নিজেই reply হলে তার root টা নেবো, না হলে target নিজেই root
      rootParentId = target.parentCommentId || target._id;
      replyToUserId = target.commentUserId;
    }

    const newComment = await Comment.create({
      postId,
      commentUserId: req.user.id,
      text: text.trim(),
      parentCommentId: rootParentId,
      replyToUserId,
    });

    if (!rootParentId) {
      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
    }

    await newComment.populate([
      { path: "commentUserId", select: USER_FIELDS },
      { path: "replyToUserId", select: MENTION_FIELDS },
    ]);

    // ===================== NOTIFICATION =====================
    try {
      if (rootParentId) {
        // Reply: যার কথার উত্তর দেওয়া হলো তাকে notify করো (নিজেকে নয়)
        if (String(replyToUserId) !== String(req.user.id)) {
          await createNotification({
            userId: replyToUserId,
            actorId: req.user.id,
            type: "reply",
            postId,
            commentId: newComment._id,
          });
        }
      } else {
        const post = await Post.findById(postId).select("userid");
        if (post) {
          await createNotification({
            userId: post.userid,
            actorId: req.user.id,
            type: "comment",
            postId,
            commentId: newComment._id,
          });
        }
      }
    } catch (err) {
      console.error("Comment notification error:", err);
    }
    // ========================================================

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: { ...newComment.toObject(), repliesCount: 0 },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ===============================
// GET COMMENTS BY POST (pagination + repliesCount)
// ===============================
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const allowed = await isAllowedPostType(postId);
    if (!allowed) {
      return res.status(403).json({
        message: "Comments are only allowed on post and course type posts",
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ postId, parentCommentId: null })
        .populate("commentUserId", USER_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ postId, parentCommentId: null }),
    ]);

    // এই page এর প্রতিটা comment এ কয়টা reply আছে
    const ids = comments.map((c) => c._id);
    const counts = ids.length
      ? await Comment.aggregate([
          { $match: { parentCommentId: { $in: ids } } },
          { $group: { _id: "$parentCommentId", count: { $sum: 1 } } },
        ])
      : [];
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    const data = comments.map((c) => ({
      ...c,
      repliesCount: countMap.get(String(c._id)) ?? 0,
    }));

    res.status(200).json({
      success: true,
      page,
      total,
      count: data.length,
      hasMore: skip + data.length < total,
      data,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ===============================
// UPDATE COMMENT
// ===============================
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (String(comment.commentUserId) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not allowed to edit this comment" });
    }

    comment.text = text?.trim() ?? comment.text;
    comment.updatedAt = new Date();
    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ===============================
// DELETE COMMENT
// ===============================
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!isValidId(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (String(comment.commentUserId) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this comment" });
    }

    // reply IDs গুলো আগে collect করো (notification delete এর জন্য)
    const replies = await Comment.find({
      parentCommentId: commentId,
    }).select("_id");
    const replyIds = replies.map((r) => r._id);

    // comment + replies delete
    await Promise.all([
      Comment.deleteOne({ _id: commentId }),
      Comment.deleteMany({ parentCommentId: commentId }),
    ]);

    if (!comment.parentCommentId) {
      await Post.findByIdAndUpdate(comment.postId, {
        $inc: { commentsCount: -1 },
      });
    }

    // ===================== NOTIFICATION DELETE =====================
    try {
      await Promise.all([
        Notification.deleteMany({
          "target.commentId": commentId,
          type: { $in: ["comment", "reply"] },
        }),
        replyIds.length > 0
          ? Notification.deleteMany({
              "target.commentId": { $in: replyIds },
              type: "reply",
            })
          : Promise.resolve(),
      ]);
    } catch (err) {
      console.error("Comment notification delete error:", err);
    }
    // ==============================================================

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ===============================
// GET REPLIES FOR A COMMENT
// ===============================
export const getRepliesByComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!isValidId(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [replies, totalReplies] = await Promise.all([
      Comment.find({ parentCommentId: commentId })
        .populate("commentUserId", USER_FIELDS)
        .populate("replyToUserId", MENTION_FIELDS)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ parentCommentId: commentId }),
    ]);

    res.status(200).json({
      success: true,
      page,
      count: replies.length,
      totalReplies,
      hasMore: skip + replies.length < totalReplies,
      data: replies,
    });
  } catch (error) {
    console.error("Error fetching replies:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
