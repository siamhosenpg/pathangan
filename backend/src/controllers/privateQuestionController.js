import mongoose from "mongoose";
import PrivateQuestion from "../models/PrivateQuestion.js";

// ===================== SEND PRIVATE QUESTION =====================
export const sendPrivateQuestion = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const { receiverId, questionText } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiverId" });
    }

    if (!questionText?.trim()) {
      return res.status(400).json({ message: "questionText is required" });
    }

    // নিজেকে নিজে question করা যাবে না
    if (req.user.id.toString() === receiverId.toString()) {
      return res.status(400).json({ message: "You cannot question yourself" });
    }

    const newQuestion = await PrivateQuestion.create({
      senderId: req.user.id, // ✅ সবসময় backend থেকে
      receiverId,
      questionText: questionText.trim(),
    });

    res.status(201).json({ success: true, question: newQuestion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET INBOX (আমাকে যে questions করা হয়েছে) =====================
export const getInbox = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
    const status = req.query.status || null; // pending / answered / ignored

    const query = { receiverId: req.user.id };
    if (cursor) query.createdAt = { $lt: cursor };
    if (status) query.status = status;

    const questions = await PrivateQuestion.find(query)
      .populate("senderId", "name username profileImage")
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    res.status(200).json({
      success: true,
      questions,
      nextCursor: hasMore ? questions[questions.length - 1].createdAt : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET SENT QUESTIONS (আমি যে questions করেছি) =====================
export const getSentQuestions = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const query = { senderId: req.user.id };
    if (cursor) query.createdAt = { $lt: cursor };

    const questions = await PrivateQuestion.find(query)
      .populate("receiverId", "name username profileImage")
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    res.status(200).json({
      success: true,
      questions,
      nextCursor: hasMore ? questions[questions.length - 1].createdAt : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET SINGLE QUESTION =====================
export const getPrivateQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid question id" });
    }

    const question = await PrivateQuestion.findById(id)
      .populate("senderId", "name username profileImage")
      .populate("receiverId", "name username profileImage")
      .lean();

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // শুধু sender আর receiver দেখতে পারবে
    const userId = req.user.id.toString();
    const isParticipant =
      question.senderId._id.toString() === userId ||
      question.receiverId._id.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    // receiver প্রথমবার দেখলে isRead = true
    if (question.receiverId._id.toString() === userId && !question.isRead) {
      await PrivateQuestion.findByIdAndUpdate(id, { isRead: true });
    }

    res.status(200).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== UPDATE STATUS (answered / ignored) =====================
export const updateQuestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid question id" });
    }

    const allowed = ["answered", "ignored"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const question = await PrivateQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // শুধু receiver status change করতে পারবে
    if (question.receiverId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Only receiver can update status" });
    }

    question.status = status;
    await question.save();

    res.status(200).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET UNREAD COUNT =====================
export const getUnreadCount = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const count = await PrivateQuestion.countDocuments({
      receiverId: req.user.id,
      isRead: false,
    });

    res.status(200).json({ success: true, unreadCount: count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== DELETE QUESTION =====================
export const deletePrivateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid question id" });
    }

    const question = await PrivateQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // sender অথবা receiver যে কেউ delete করতে পারবে
    const userId = req.user.id.toString();
    const isParticipant =
      question.senderId.toString() === userId ||
      question.receiverId.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    await PrivateQuestion.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
