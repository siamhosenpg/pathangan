import mongoose from "mongoose";
import Post from "../../models/postmodel.js";

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
      .exec();

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    res.json({
      questions,
      nextCursor: hasMore ? questions[questions.length - 1].createdAt : null,
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
      .exec();

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    return res.status(200).json({
      questions,
      count: questions.length,
      nextCursor: hasMore ? questions[questions.length - 1].createdAt : null,
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
      .exec();

    if (!question)
      return res.status(404).json({ message: "Question not found" });

    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
