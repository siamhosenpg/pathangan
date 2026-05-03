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

    // Answer exist করে কিনা চেক
    const answer = await Answer.findOne({ _id: answerId, isDeleted: false });
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    const questionId = answer.questionId;

    // Question post exist করে কিনা চেক
    const questionPost = await Post.findOne({
      _id: questionId,
      postType: "question",
    });
    if (!questionPost) {
      return res.status(404).json({ message: "Question post not found" });
    }

    // নিজের answer নিজে rate করা যাবে না
    if (answer.userId.toString() === userId.toString()) {
      return res
        .status(403)
        .json({ message: "You cannot rate your own answer" });
    }

    // Upsert — আগে থেকে থাকলে update, না থাকলে create
    const existingRating = await Rating.findOneAndUpdate(
      { userId, answerId },
      { rating, questionId },
      { new: true, upsert: true, runValidators: true },
    );

    // Aggregate করে average ও count বের করা
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

    // প্রতিটি answer এর average rating এক সাথে দেখাবে
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
