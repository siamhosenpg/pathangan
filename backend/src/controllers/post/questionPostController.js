import mongoose from "mongoose";
import Post from "../../models/postmodel.js";
import Reaction from "../../models/reactionModel.js";

// ===================== GET ALL QUESTION POSTS (cursor-based) =====================
export const getAllQuestions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const query = { postType: "question" };
    if (cursor) query.createdAt = { $lt: cursor };

    const questions = await Post.find(query)
      .populate("userid", "name username badges profileImage gender")
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean(); // .exec() → .lean()

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    // ── Reaction merge ────────────────────────────────────
    const userId = req.user?.id || null;
    let reactedSet = new Set();

    if (userId && questions.length > 0) {
      const postIds = questions.map((q) => q._id);

      const reactions = await Reaction.find({
        userId,
        postId: { $in: postIds },
      })
        .select("postId")
        .lean();

      reactedSet = new Set(reactions.map((r) => r.postId.toString()));
    }

    const finalQuestions = questions.map((q) => ({
      ...q,
      isReacted: reactedSet.has(q._id.toString()),
    }));
    // ─────────────────────────────────────────────────────

    res.json({
      questions: finalQuestions,
      nextCursor: hasMore
        ? finalQuestions[finalQuestions.length - 1].createdAt
        : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================== GET QUESTION POSTS BY USERID =====================
export const getQuestionsByUserId = async (req, res) => {
  try {
    const { userid } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const query = { userid, postType: "question" };
    if (cursor) query.createdAt = { $lt: cursor };

    const questions = await Post.find(query)
      .populate("userid", "name username badges profileImage gender")
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean(); // .exec() → .lean()

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    // ── Reaction merge ────────────────────────────────────
    const currentUserId = req.user?.id || null;
    let reactedSet = new Set();

    if (currentUserId && questions.length > 0) {
      const postIds = questions.map((q) => q._id);

      const reactions = await Reaction.find({
        userId: currentUserId,
        postId: { $in: postIds },
      })
        .select("postId")
        .lean();

      reactedSet = new Set(reactions.map((r) => r.postId.toString()));
    }

    const finalQuestions = questions.map((q) => ({
      ...q,
      isReacted: reactedSet.has(q._id.toString()),
    }));
    // ─────────────────────────────────────────────────────

    return res.status(200).json({
      questions: finalQuestions,
      count: finalQuestions.length,
      nextCursor: hasMore
        ? finalQuestions[finalQuestions.length - 1].createdAt
        : null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET SINGLE QUESTION BY ID =====================
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const question = await Post.findOne({ _id: id, postType: "question" })
      .populate("userid", "name username badges bio profileImage gender")
      .lean(); // .exec() → .lean()

    if (!question)
      return res.status(404).json({ message: "Question not found" });

    // ── Reaction check (single question) ─────────────────
    const userId = req.user?.id || null;
    let isReacted = false;

    if (userId) {
      const reaction = await Reaction.findOne({
        userId,
        postId: question._id,
      }).lean();

      isReacted = !!reaction;
    }
    // ─────────────────────────────────────────────────────

    res.json({ ...question, isReacted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
