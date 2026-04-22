import Comment from "../models/commentsModel.js";

export const getCommentsCount = async (req, res) => {
  try {
    const { postId } = req.params;
    const count = await Comment.countDocuments({ postId });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// CREATE COMMENT
// ===============================
export const createComment = async (req, res) => {
  try {
    const { postId, text, media, parentCommentId } = req.body;

    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const newComment = await Comment.create({
      postId,
      commentUserId: req.user.id, // from auth middleware
      text,
      media,
      parentCommentId: parentCommentId || null, // null হলে main comment
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: newComment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ===============================
// GET COMMENTS BY POST (WITH PAGINATION)
// ===============================
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 🔹 Only main comments (parentCommentId = null)
    const comments = await Comment.find({ postId, parentCommentId: null })
      .populate(
        "commentUserId",
        "name userid profileImage  gender username badges",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      count: comments.length,
      data: comments,
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
    const { text, media } = req.body;

    const comment = await Comment.findOne({ _id: commentId });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // owner check
    if (String(comment.commentUserId) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not allowed to edit this comment" });
    }

    comment.text = text ?? comment.text;
    comment.media = media ?? comment.media;
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

    const comment = await Comment.findOne({ _id: commentId });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // owner check
    if (String(comment.commentUserId) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this comment" });
    }

    await Comment.deleteOne({ _id: commentId });

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

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Replies query
    const replies = await Comment.find({ parentCommentId: commentId })
      .populate(
        "commentUserId",
        "name userid profileImage gender username badges",
      )
      .sort({ createdAt: 1 }) // oldest first
      .skip(skip)
      .limit(limit);

    // Total count
    const totalReplies = await Comment.countDocuments({
      parentCommentId: commentId,
    });

    res.status(200).json({
      success: true,
      page,
      count: replies.length,
      totalReplies,
      data: replies,
    });
  } catch (error) {
    console.error("Error fetching replies:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
