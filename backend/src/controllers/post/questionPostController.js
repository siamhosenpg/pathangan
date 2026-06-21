import mongoose from "mongoose";
import Post from "../../models/postmodel.js";
import Reaction from "../../models/reactionModel.js";
import Follow from "../../models/followModel.js";
import Answer from "../../models/answer/answerModel.js";

// প্রতি question card এ preview হিসেবে কতগুলো answer দেখানো হবে
const PREVIEW_ANSWERS_LIMIT = 2;

// ===================== Helper: batch answer preview fetch (N+1 fix) =====================
const attachAnswerPreviews = async (questions) => {
  if (questions.length === 0) return questions;

  const questionIds = questions.map((q) => q._id);

  // একটাই aggregation query দিয়ে প্রতিটা questionId এর জন্য সর্বোচ্চ
  // PREVIEW_ANSWERS_LIMIT সংখ্যক answer (best answer আগে, তারপর সাম্প্রতিক) আনা হচ্ছে
  const answerGroups = await Answer.aggregate([
    {
      $match: {
        questionId: { $in: questionIds },
        isDeleted: false,
      },
    },
    { $sort: { isBestAnswer: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$questionId",
        answers: { $push: "$$ROOT" },
        totalCount: { $sum: 1 },
      },
    },
    {
      $project: {
        answers: { $slice: ["$answers", PREVIEW_ANSWERS_LIMIT] },
        totalCount: 1,
      },
    },
  ]);

  // questionId অনুযায়ী দ্রুত lookup এর জন্য Map বানানো
  const answersByQuestionId = new Map(
    answerGroups.map((group) => [group._id.toString(), group]),
  );

  // answer এর ভেতরের userId populate করার জন্য সব userId একসাথে সংগ্রহ
  const allAnswerUserIds = new Set();
  answerGroups.forEach((group) => {
    group.answers.forEach((a) => {
      if (a.userId) allAnswerUserIds.add(a.userId.toString());
    });
  });

  let answerUsersMap = new Map();
  if (allAnswerUserIds.size > 0) {
    const User = mongoose.model("User"); // আপনার User model এর registered নাম
    const answerUsers = await User.find({
      _id: { $in: Array.from(allAnswerUserIds) },
    })
      .select("name username profileImage badges")
      .lean();

    answerUsersMap = new Map(answerUsers.map((u) => [u._id.toString(), u]));
  }

  // প্রতিটা question এ তার preview answers বসিয়ে দেওয়া
  return questions.map((q) => {
    const group = answersByQuestionId.get(q._id.toString());

    const previewAnswers = group
      ? group.answers.map((a) => ({
          ...a,
          userId: answerUsersMap.get(a.userId?.toString()) || a.userId,
        }))
      : [];

    return {
      ...q,
      previewAnswers,
      answersCount: group ? group.totalCount : 0,
    };
  });
};

// ===================== GET ALL QUESTION POSTS (cursor-based, N+1 fixed) =====================
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
      .lean();

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    const userId = req.user?.id || null;

    // ── Reaction merge ────────────────────────────────────
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

    // ── Follow status merge (N+1 fix) ──────────────────────
    let followingSet = new Set();

    if (userId && questions.length > 0) {
      const authorIds = new Set();

      questions.forEach((q) => {
        if (q.userid?._id) authorIds.add(q.userid._id.toString());
      });

      // নিজেকে বাদ দেওয়া
      authorIds.delete(userId.toString());

      if (authorIds.size > 0) {
        const followings = await Follow.find({
          followerId: userId,
          followingId: { $in: Array.from(authorIds) },
        })
          .select("followingId")
          .lean();

        followingSet = new Set(followings.map((f) => f.followingId.toString()));
      }
    }

    // ── Final merge: isReacted + userid.isFollowing ────────
    let finalQuestions = questions.map((q) => {
      const merged = {
        ...q,
        isReacted: reactedSet.has(q._id.toString()),
      };

      if (merged.userid) {
        merged.userid = {
          ...merged.userid,
          isFollowing: followingSet.has(merged.userid._id.toString()),
        };
      }

      return merged;
    });

    // ── Answer preview merge (N+1 fix) ─────────────────────
    finalQuestions = await attachAnswerPreviews(finalQuestions);
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
      .lean();

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    const currentUserId = req.user?.id || null;

    // ── Reaction merge ────────────────────────────────────
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

    // ── Follow status merge (N+1 fix) ──────────────────────
    let followingSet = new Set();

    if (currentUserId && questions.length > 0) {
      const authorIds = new Set();

      questions.forEach((q) => {
        if (q.userid?._id) authorIds.add(q.userid._id.toString());
      });

      authorIds.delete(currentUserId.toString());

      if (authorIds.size > 0) {
        const followings = await Follow.find({
          followerId: currentUserId,
          followingId: { $in: Array.from(authorIds) },
        })
          .select("followingId")
          .lean();

        followingSet = new Set(followings.map((f) => f.followingId.toString()));
      }
    }

    // ── Final merge ─────────────────────────────────────────
    let finalQuestions = questions.map((q) => {
      const merged = {
        ...q,
        isReacted: reactedSet.has(q._id.toString()),
      };

      if (merged.userid) {
        merged.userid = {
          ...merged.userid,
          isFollowing: followingSet.has(merged.userid._id.toString()),
        };
      }

      return merged;
    });

    // ── Answer preview merge (N+1 fix) ─────────────────────
    finalQuestions = await attachAnswerPreviews(finalQuestions);
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
      .lean();

    if (!question)
      return res.status(404).json({ message: "Question not found" });

    const userId = req.user?.id || null;

    // ── Reaction check (single question) ─────────────────
    let isReacted = false;

    if (userId) {
      const reaction = await Reaction.findOne({
        userId,
        postId: question._id,
      }).lean();

      isReacted = !!reaction;
    }

    // ── Follow status (single user, single query — N+1 হওয়ার সুযোগ নেই এখানে) ──
    let isFollowing = false;

    if (userId && question.userid?._id) {
      const authorId = question.userid._id.toString();

      if (authorId !== userId.toString()) {
        const followRecord = await Follow.findOne({
          followerId: userId,
          followingId: authorId,
        }).lean();

        isFollowing = !!followRecord;
      }
    }
    // ─────────────────────────────────────────────────────

    res.json({
      ...question,
      isReacted,
      userid: { ...question.userid, isFollowing },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
