import mongoose from "mongoose";
import Rating from "../../models/rating/ratingModel.js";
import Chapter from "../../models/chapterModel.js";
import Handout from "../../models/handoutModel.js";
import { getBlockRelation } from "../../helpers/blockHelper.js";

// ===================== helper: handout এর average (সব live chapter মিলিয়ে) =====================
export const syncHandoutRatingStats = async (handoutId) => {
  const chapterIds = await Chapter.find({
    handout: handoutId,
    isDeleted: false,
  }).distinct("_id");

  let averageRating = 0;
  let ratingCount = 0;

  if (chapterIds.length > 0) {
    const stats = await Rating.aggregate([
      { $match: { targetType: "chapter", chapterId: { $in: chapterIds } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    averageRating = stats[0]?.averageRating
      ? parseFloat(stats[0].averageRating.toFixed(2))
      : 0;
    ratingCount = stats[0]?.ratingCount || 0;
  }

  await Handout.updateOne(
    { _id: handoutId },
    { $set: { averageRating, ratingCount } },
  );

  return { averageRating, ratingCount };
};

// ===================== helper: একটা chapter এর stats =====================
const getChapterStats = async (chapterId) => {
  const stats = await Rating.aggregate([
    {
      $match: {
        targetType: "chapter",
        chapterId: new mongoose.Types.ObjectId(chapterId),
      },
    },
    {
      $group: {
        _id: "$chapterId",
        averageRating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  return {
    averageRating: stats[0]?.averageRating
      ? parseFloat(stats[0].averageRating.toFixed(2))
      : 0,
    ratingCount: stats[0]?.ratingCount || 0,
  };
};

// ===================== GIVE OR UPDATE CHAPTER RATING =====================
export const giveChapterRating = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "Invalid chapter ID" });
    }

    const { rating } = req.body;

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res
        .status(400)
        .json({ message: "Rating must be a whole number between 1 and 5" });
    }

    const chapter = await Chapter.findOne({ _id: chapterId, isDeleted: false });
    if (!chapter) return res.status(404).json({ message: "Chapter not found" });

    const handout = await Handout.findOne({
      _id: chapter.handout,
      isDeleted: false,
      status: "published",
    }).select("user");
    if (!handout) return res.status(404).json({ message: "Handout not found" });

    if (handout.user.toString() === userId.toString()) {
      return res
        .status(403)
        .json({ message: "You cannot rate your own chapter" });
    }

    // ── Block check ──
    const relation = await getBlockRelation(userId, handout.user);
    if (relation.any) {
      return res.status(404).json({ message: "Handout not found" });
    }

    const saved = await Rating.findOneAndUpdate(
      { userId, chapterId },
      { rating, targetType: "chapter", handoutId: handout._id },
      { new: true, upsert: true, runValidators: true },
    );

    const handoutStats = await syncHandoutRatingStats(handout._id);
    const chapterStats = await getChapterStats(chapterId);

    return res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      chapterId,
      handoutId: handout._id.toString(),
      userRating: saved.rating,
      averageRating: chapterStats.averageRating,
      ratingCount: chapterStats.ratingCount,
      handoutAverageRating: handoutStats.averageRating,
      handoutRatingCount: handoutStats.ratingCount,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Rating conflict, try again" });
    }
    console.error("giveChapterRating error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET CHAPTER RATING (stats + আমার rating + isOwner) =====================
export const getChapterRating = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "Invalid chapter ID" });
    }

    const chapter = await Chapter.findOne({ _id: chapterId, isDeleted: false })
      .select("_id user")
      .lean();
    if (!chapter) return res.status(404).json({ message: "Chapter not found" });

    // ✅ নিজের chapter কিনা — app এই flag দেখে rating UI লুকাবে
    const isOwner = !!userId && chapter.user.toString() === userId.toString();

    const { averageRating, ratingCount } = await getChapterStats(chapterId);

    let userRating = null;
    if (userId) {
      const mine = await Rating.findOne({ userId, chapterId })
        .select("rating")
        .lean();
      userRating = mine?.rating ?? null;
    }

    return res.status(200).json({
      success: true,
      chapterId,
      averageRating,
      ratingCount,
      userRating,
      isOwner,
    });
  } catch (err) {
    console.error("getChapterRating error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET HANDOUT RATING (সব chapter এর average) =====================
export const getHandoutRating = async (req, res) => {
  try {
    const { handoutId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(handoutId)) {
      return res.status(400).json({ message: "Invalid handout ID" });
    }

    const handout = await Handout.findOne({ _id: handoutId, isDeleted: false })
      .select("averageRating ratingCount")
      .lean();
    if (!handout) return res.status(404).json({ message: "Handout not found" });

    return res.status(200).json({
      success: true,
      handoutId,
      averageRating: handout.averageRating || 0,
      ratingCount: handout.ratingCount || 0,
    });
  } catch (err) {
    console.error("getHandoutRating error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== DELETE CHAPTER RATING =====================
export const deleteChapterRating = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "Invalid chapter ID" });
    }

    const rating = await Rating.findOneAndDelete({
      userId,
      chapterId,
      targetType: "chapter",
    });

    if (!rating) {
      return res
        .status(404)
        .json({ message: "You have not rated this chapter" });
    }

    const handoutStats = await syncHandoutRatingStats(rating.handoutId);

    return res.status(200).json({
      success: true,
      message: "Rating removed successfully",
      chapterId,
      handoutId: rating.handoutId.toString(),
      handoutAverageRating: handoutStats.averageRating,
      handoutRatingCount: handoutStats.ratingCount,
    });
  } catch (err) {
    console.error("deleteChapterRating error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
