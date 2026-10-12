import mongoose from "mongoose";
import Answer from "../../models/answer/answerModel.js";
import Post from "../../models/postmodel.js";
import {
  getBlockedUserIds,
  getBlockRelation,
} from "../../helpers/blockHelper.js";

const POPULATE_USER = "name username profileImage badges";

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

    // ── Block check: প্রশ্নকারীর সাথে block থাকলে উত্তর দেওয়া যাবে না ──
    const relation = await getBlockRelation(userId, questionPost.userid);
    if (relation.any) {
      return res.status(404).json({
        message: "Question not found or this post is not a question",
      });
    }

    const { text } = req.body;
    const trimmed = text?.trim();

    if (!trimmed) {
      return res.status(400).json({ message: "Answer text is required" });
    }
    if (trimmed.length < 5) {
      return res
        .status(400)
        .json({ message: "Answer must be at least 5 characters" });
    }
    if (trimmed.length > 10000) {
      return res
        .status(400)
        .json({ message: "Answer cannot exceed 10000 characters" });
    }

    // active (delete হয়নি) answer থাকলে নতুন দেওয়া যাবে না
    const existing = await Answer.findOne({
      questionId,
      userId,
      isDeleted: false,
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "You have already answered this question" });
    }

    // আগে delete করা answer থাকলে সেটাকেই নতুন করে চালু করা হবে
    const deletedAnswer = await Answer.findOne({
      questionId,
      userId,
      isDeleted: true,
    }).sort({ updatedAt: -1 });

    let answer;

    if (deletedAnswer) {
      deletedAnswer.text = trimmed;
      deletedAnswer.isDeleted = false;
      deletedAnswer.isBestAnswer = false;
      deletedAnswer.upvotes = [];
      deletedAnswer.downvotes = [];
      deletedAnswer.upvotesCount = 0;
      deletedAnswer.downvotesCount = 0;
      await deletedAnswer.save();
      answer = deletedAnswer;
    } else {
      answer = await Answer.create({
        questionId,
        userId,
        text: trimmed,
      });
    }

    await answer.populate("userId", POPULATE_USER);

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

    // ── Block: viewer-এর সাথে দুই দিকের blocked user ──
    const blockedIds = await getBlockedUserIds(req.user?.id);

    // প্রশ্নকারী blocked হলে পুরো question লুকানো
    if (blockedIds.length > 0) {
      const questionPost = await Post.findById(questionId)
        .select("userid")
        .lean();

      if (
        questionPost &&
        blockedIds.some((b) => b.toString() === questionPost.userid.toString())
      ) {
        return res.status(404).json({ message: "Question not found" });
      }
    }

    const blockFilter =
      blockedIds.length > 0 ? { userId: { $nin: blockedIds } } : {};

    const matchQuery = {
      questionId: new mongoose.Types.ObjectId(questionId),
      isDeleted: false,
      ...blockFilter,
    };

    if (cursor) matchQuery._id = { $lt: cursor };

    const answers = await Answer.find(matchQuery)
      .populate("userId", POPULATE_USER)
      .sort({ isBestAnswer: -1, createdAt: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = answers.length > limit;
    if (hasMore) answers.pop();

    const totalCount = await Answer.countDocuments({
      questionId,
      isDeleted: false,
      ...blockFilter,
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
    }).populate("userId", POPULATE_USER);

    if (!answer) return res.status(404).json({ message: "Answer not found" });

    // ── Block check ──
    const viewerId = req.user?.id;
    if (viewerId && answer.userId?._id) {
      const relation = await getBlockRelation(viewerId, answer.userId._id);
      if (relation.any) {
        return res.status(404).json({ message: "Answer not found" });
      }
    }

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
    const trimmed = text?.trim();

    if (!trimmed) {
      return res.status(400).json({ message: "Answer text is required" });
    }
    if (trimmed.length < 5) {
      return res
        .status(400)
        .json({ message: "Answer must be at least 5 characters" });
    }
    if (trimmed.length > 10000) {
      return res
        .status(400)
        .json({ message: "Answer cannot exceed 10000 characters" });
    }

    answer.text = trimmed;
    await answer.save();
    await answer.populate("userId", POPULATE_USER);

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
    answer.isBestAnswer = false;
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

    // block থাকলে ওই user-এর answer best করা যাবে না
    const relation = await getBlockRelation(userId, answer.userId);
    if (relation.any) {
      return res.status(404).json({ message: "Answer not found" });
    }

    await Answer.updateMany(
      { questionId: answer.questionId, isBestAnswer: true },
      { isBestAnswer: false },
    );

    answer.isBestAnswer = true;
    await answer.save();
    await answer.populate("userId", POPULATE_USER);

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

    // ── Block check: block থাকলে vote করা যাবে না ──
    const relation = await getBlockRelation(userId, answer.userId);
    if (relation.any) {
      return res.status(404).json({ message: "Answer not found" });
    }

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

    const blockedIds = await getBlockedUserIds(userId);
    const blockedSet = new Set(blockedIds.map((b) => b.toString()));

    const matchQuery = { userId, isDeleted: false };
    if (cursor) matchQuery._id = { $lt: cursor };

    const rawAnswers = await Answer.find(matchQuery)
      .populate({
        path: "questionId",
        // userid লাগছে block filter-এর জন্য
        select: "question.questionText postType createdAt userid",
      })
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = rawAnswers.length > limit;
    if (hasMore) rawAnswers.pop();

    // pagination ভাঙা এড়াতে cursor raw page-এর শেষ থেকে নেওয়া হচ্ছে
    const nextCursor =
      hasMore && rawAnswers.length > 0
        ? rawAnswers[rawAnswers.length - 1]._id
        : null;

    // প্রশ্নকারী blocked হলে সেই answer আমার list-এও দেখা যাবে না
    const answers = rawAnswers.filter((a) => {
      const authorId = a.questionId?.userid?.toString();
      return !(authorId && blockedSet.has(authorId));
    });

    return res.status(200).json({
      success: true,
      answers,
      hasMore,
      nextCursor,
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

    // list-এর সাথে count মেলাতে blocked user-এর answer বাদ
    const blockedIds = await getBlockedUserIds(req.user?.id);

    const count = await Answer.countDocuments({
      questionId,
      isDeleted: false,
      ...(blockedIds.length > 0 && { userId: { $nin: blockedIds } }),
    });

    return res.status(200).json({ success: true, questionId, count });
  } catch (err) {
    console.error("getAnswerCount error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
