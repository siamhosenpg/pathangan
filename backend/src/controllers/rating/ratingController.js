import mongoose from "mongoose";
import Rating from "../../models/rating/ratingModel.js";
import Answer from "../../models/answer/answerModel.js";
import Post from "../../models/postmodel.js";

// ===================== GIVE OR UPDATE RATING =====================
export const giveRating = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const { rating } = req.body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5" });
    }

    const answer = await Answer.findOne({ _id: answerId, isDeleted: false });
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    const questionId = answer.questionId;
    const answerUserId = answer.userId; // ← answer যে করেছে তার id

    const questionPost = await Post.findOne({
      _id: questionId,
      postType: "question",
    });
    if (!questionPost) {
      return res.status(404).json({ message: "Question post not found" });
    }

    if (answer.userId.toString() === userId.toString()) {
      return res
        .status(403)
        .json({ message: "You cannot rate your own answer" });
    }

    // answerUserId সহ upsert
    const existingRating = await Rating.findOneAndUpdate(
      { userId, answerId },
      { rating, questionId, answerUserId },
      { new: true, upsert: true, runValidators: true },
    );

    const stats = await Rating.aggregate([
      { $match: { answerId: new mongoose.Types.ObjectId(answerId) } },
      {
        $group: {
          _id: "$answerId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats[0]?.averageRating
      ? parseFloat(stats[0].averageRating.toFixed(2))
      : rating;
    const ratingCount = stats[0]?.ratingCount || 1;

    return res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      userRating: existingRating.rating,
      averageRating,
      ratingCount,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Rating conflict, try again" });
    }
    console.error("giveRating error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET RATINGS FOR AN ANSWER =====================
export const getRatingsByAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const stats = await Rating.aggregate([
      { $match: { answerId: new mongoose.Types.ObjectId(answerId) } },
      {
        $group: {
          _id: "$answerId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats[0]?.averageRating
      ? parseFloat(stats[0].averageRating.toFixed(2))
      : 0;
    const ratingCount = stats[0]?.ratingCount || 0;

    return res.status(200).json({
      success: true,
      answerId,
      averageRating,
      ratingCount,
    });
  } catch (err) {
    console.error("getRatingsByAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET MY RATING FOR AN ANSWER =====================
export const getMyRating = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const rating = await Rating.findOne({ userId, answerId });

    return res.status(200).json({
      success: true,
      userRating: rating ? rating.rating : null,
    });
  } catch (err) {
    console.error("getMyRating error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== DELETE RATING =====================
export const deleteRating = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const rating = await Rating.findOneAndDelete({ userId, answerId });

    if (!rating) {
      return res
        .status(404)
        .json({ message: "You have not rated this answer" });
    }

    return res.status(200).json({
      success: true,
      message: "Rating removed successfully",
    });
  } catch (err) {
    console.error("deleteRating error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET ALL RATINGS BY QUESTION =====================
export const getRatingsByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const stats = await Rating.aggregate([
      { $match: { questionId: new mongoose.Types.ObjectId(questionId) } },
      {
        $group: {
          _id: "$answerId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
      { $sort: { averageRating: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      questionId,
      answerRatings: stats.map((s) => ({
        answerId: s._id,
        averageRating: parseFloat(s.averageRating.toFixed(2)),
        ratingCount: s.ratingCount,
      })),
    });
  } catch (err) {
    console.error("getRatingsByQuestion error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET USER'S AVERAGE RATING (সে কতটুকু rating পেয়েছে) =====================
export const getUserAverageRating = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const stats = await Rating.aggregate([
      { $match: { answerUserId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$answerUserId",
          averageRating: { $avg: "$rating" },
          totalRatingCount: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats[0]?.averageRating
      ? parseFloat(stats[0].averageRating.toFixed(2))
      : 0;
    const totalRatingCount = stats[0]?.totalRatingCount || 0;

    return res.status(200).json({
      success: true,
      userId,
      averageRating,
      totalRatingCount,
    });
  } catch (err) {
    console.error("getUserAverageRating error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
