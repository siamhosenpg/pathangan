// controllers/privateAnswer/privateAnswerController.js
import mongoose from "mongoose";
import Answer from "../../models/answer/answerModel.js";
import PrivateQuestion from "../../models/PrivateQuestion.js";

// ===================== CREATE PRIVATE ANSWER =====================
export const createPrivateAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const privateQuestion = await PrivateQuestion.findById(questionId);

    if (!privateQuestion) {
      return res.status(404).json({ message: "Private question not found" });
    }

    if (privateQuestion.receiverId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the receiver can answer this question" });
    }

    if (privateQuestion.status === "answered") {
      return res
        .status(409)
        .json({ message: "This question has already been answered" });
    }

    if (privateQuestion.status === "ignored") {
      return res
        .status(403)
        .json({ message: "This question has been ignored" });
    }

    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Answer text is required" });
    }
    if (text.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Answer must be at least 2 characters" });
    }
    if (text.trim().length > 2000) {
      return res
        .status(400)
        .json({ message: "Answer cannot exceed 2000 characters" });
    }

    const existing = await Answer.findOne({ questionId, userId });
    if (existing) {
      return res
        .status(409)
        .json({ message: "You have already answered this question" });
    }

    const answer = await Answer.create({
      questionId,
      userId,
      text: text.trim(),
    });

    // ref "Post" এর বদলে manually "User" দিয়ে populate
    await answer.populate("userId", "name username profileImage badges");

    // status update
    privateQuestion.status = "answered";
    await privateQuestion.save();

    return res.status(201).json({
      success: true,
      message: "Answer posted successfully",
      answer,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "You have already answered this question" });
    }
    console.error("createPrivateAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET ANSWER BY QUESTION ID =====================
export const getPrivateAnswerByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const answer = await Answer.findOne({
      questionId,
      isDeleted: false,
    }).populate("userId", "name username profileImage badges");

    return res.status(200).json({
      success: true,
      answer: answer ?? null,
    });
  } catch (err) {
    console.error("getPrivateAnswerByQuestion error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
