import mongoose from "mongoose";
import Answer from "../../models/answer/answerModel.js";
import Post from "../../models/postmodel.js";

// ===================== CREATE ANSWER =====================
export const createAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const questionPost = await Post.findOne({
      _id: questionId,
      postType: "question",
    });

    if (!questionPost) {
      return res.status(404).json({
        message: "Question not found or this post is not a question",
      });
    }

    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Answer text is required" });
    }
    if (text.trim().length < 5) {
      return res
        .status(400)
        .json({ message: "Answer must be at least 5 characters" });
    }
    if (text.trim().length > 10000) {
      return res
        .status(400)
        .json({ message: "Answer cannot exceed 10000 characters" });
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
    await answer.populate("userId", "name username profileImage badges");

    return res
      .status(201)
      .json({ success: true, message: "Answer posted successfully", answer });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "You have already answered this question" });
    }
    console.error("createAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET ALL ANSWERS FOR A QUESTION =====================
export const getAnswersByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor
      ? new mongoose.Types.ObjectId(req.query.cursor)
      : null;

    const matchQuery = {
      questionId: new mongoose.Types.ObjectId(questionId),
      isDeleted: false,
    };

    if (cursor) matchQuery._id = { $lt: cursor };

    const answers = await Answer.find(matchQuery)
      .populate("userId", "name username profileImage badges")
      .sort({ isBestAnswer: -1, createdAt: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = answers.length > limit;
    if (hasMore) answers.pop();

    const totalCount = await Answer.countDocuments({
      questionId,
      isDeleted: false,
    });

    return res.status(200).json({
      success: true,
      answers,
      totalCount,
      hasMore,
      nextCursor: hasMore ? answers[answers.length - 1]._id : null,
    });
  } catch (err) {
    console.error("getAnswersByQuestion error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET SINGLE ANSWER =====================
export const getAnswerById = async (req, res) => {
  try {
    const { answerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const answer = await Answer.findOne({
      _id: answerId,
      isDeleted: false,
    }).populate("userId", "name username profileImage badges");

    if (!answer) return res.status(404).json({ message: "Answer not found" });

    return res.status(200).json({ success: true, answer });
  } catch (err) {
    console.error("getAnswerById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== UPDATE ANSWER =====================
export const updateAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const answer = await Answer.findOne({ _id: answerId, isDeleted: false });
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    if (answer.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own answers" });
    }

    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Answer text is required" });
    }
    if (text.trim().length < 5) {
      return res
        .status(400)
        .json({ message: "Answer must be at least 5 characters" });
    }
    if (text.trim().length > 10000) {
      return res
        .status(400)
        .json({ message: "Answer cannot exceed 10000 characters" });
    }

    answer.text = text.trim();
    await answer.save();
    await answer.populate("userId", "name username profileImage badges");

    return res
      .status(200)
      .json({ success: true, message: "Answer updated successfully", answer });
  } catch (err) {
    console.error("updateAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== DELETE ANSWER (Soft Delete) =====================
export const deleteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const answer = await Answer.findOne({ _id: answerId, isDeleted: false });
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    if (answer.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own answers" });
    }

    answer.isDeleted = true;
    await answer.save();

    return res
      .status(200)
      .json({ success: true, message: "Answer deleted successfully" });
  } catch (err) {
    console.error("deleteAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== MARK AS BEST ANSWER =====================
export const markBestAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const answer = await Answer.findOne({ _id: answerId, isDeleted: false });
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    const questionPost = await Post.findById(answer.questionId);
    if (!questionPost) {
      return res.status(404).json({ message: "Question post not found" });
    }

    if (questionPost.userid.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the question owner can mark a best answer" });
    }

    await Answer.updateMany(
      { questionId: answer.questionId, isBestAnswer: true },
      { isBestAnswer: false },
    );

    answer.isBestAnswer = true;
    await answer.save();
    await answer.populate("userId", "name username profileImage badges");

    return res.status(200).json({
      success: true,
      message: "Best answer marked successfully",
      answer,
    });
  } catch (err) {
    console.error("markBestAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== VOTE ANSWER =====================
export const voteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { voteType } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!["upvote", "downvote"].includes(voteType)) {
      return res
        .status(400)
        .json({ message: "voteType must be 'upvote' or 'downvote'" });
    }

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const answer = await Answer.findOne({ _id: answerId, isDeleted: false });
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    const userObjId = new mongoose.Types.ObjectId(userId);

    if (voteType === "upvote") {
      const alreadyUpvoted = answer.upvotes.some((id) => id.equals(userObjId));
      if (alreadyUpvoted) {
        answer.upvotes.pull(userObjId);
        answer.upvotesCount = Math.max(0, answer.upvotesCount - 1);
      } else {
        answer.upvotes.addToSet(userObjId);
        answer.upvotesCount += 1;
        if (answer.downvotes.some((id) => id.equals(userObjId))) {
          answer.downvotes.pull(userObjId);
          answer.downvotesCount = Math.max(0, answer.downvotesCount - 1);
        }
      }
    } else {
      const alreadyDownvoted = answer.downvotes.some((id) =>
        id.equals(userObjId),
      );
      if (alreadyDownvoted) {
        answer.downvotes.pull(userObjId);
        answer.downvotesCount = Math.max(0, answer.downvotesCount - 1);
      } else {
        answer.downvotes.addToSet(userObjId);
        answer.downvotesCount += 1;
        if (answer.upvotes.some((id) => id.equals(userObjId))) {
          answer.upvotes.pull(userObjId);
          answer.upvotesCount = Math.max(0, answer.upvotesCount - 1);
        }
      }
    }

    await answer.save();

    return res.status(200).json({
      success: true,
      upvotesCount: answer.upvotesCount,
      downvotesCount: answer.downvotesCount,
    });
  } catch (err) {
    console.error("voteAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET MY ANSWERS =====================
export const getMyAnswers = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor
      ? new mongoose.Types.ObjectId(req.query.cursor)
      : null;

    const matchQuery = { userId, isDeleted: false };
    if (cursor) matchQuery._id = { $lt: cursor };

    const answers = await Answer.find(matchQuery)
      .populate({
        path: "questionId",
        select: "question.questionText postType createdAt",
      })
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = answers.length > limit;
    if (hasMore) answers.pop();

    return res.status(200).json({
      success: true,
      answers,
      hasMore,
      nextCursor: hasMore ? answers[answers.length - 1]._id : null,
    });
  } catch (err) {
    console.error("getMyAnswers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET ANSWER COUNT =====================
export const getAnswerCount = async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const count = await Answer.countDocuments({ questionId, isDeleted: false });

    return res.status(200).json({ success: true, questionId, count });
  } catch (err) {
    console.error("getAnswerCount error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
