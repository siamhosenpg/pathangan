import mongoose from "mongoose";
import UserInterest from "../../models/feed/userInterestModel.js";
import { FEED_CONFIG } from "../../helpers/feed/feedConfig.js";
import {
  CATEGORY_BY_SLUG,
  CATEGORY_TAXONOMY,
  GENERAL_CATEGORY,
  normalizeCategory,
} from "../../helpers/feed/categoryTaxonomy.js";
import {
  getInterestProfile,
  incrementInterest,
  trackInterest,
} from "../../helpers/feed/trackInterest.js";

// ===================== GET ALL CATEGORIES (বিষয় বাছাইয়ের তালিকা) =====================
// GET /feed/categories
export const getCategories = (_req, res) => {
  res.json({ success: true, categories: CATEGORY_TAXONOMY });
};

// ===================== GET MY INTERESTS =====================
// GET /feed/interests
export const getMyInterests = async (req, res) => {
  try {
    const userId = req.user.id;

    const [doc, profile] = await Promise.all([
      UserInterest.findOne({ userId }).select("selected").lean(),
      getInterestProfile(userId),
    ]);

    const top = profile.top.map((c) => ({
      category: c.category,
      en: CATEGORY_BY_SLUG.get(c.category)?.en || c.category,
      bn: CATEGORY_BY_SLUG.get(c.category)?.bn || c.category,
      score: Number(c.score.toFixed(1)),
    }));

    return res.json({
      success: true,
      selected: doc?.selected || [],
      top,
      hasInterests: top.length > 0,
    });
  } catch (err) {
    console.error("Get interests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== SET MY INTERESTS (প্রথমবারের বাছাই / সেটিংস) =====================
// PUT /feed/interests   body: { categories: ["cricket", "poetry", ...] }
export const setMyInterests = async (req, res) => {
  try {
    const userId = req.user.id;
    const input = Array.isArray(req.body?.categories)
      ? req.body.categories
      : [];

    const selected = [
      ...new Set(
        input.map(normalizeCategory).filter((c) => c && c !== GENERAL_CATEGORY),
      ),
    ];

    if (
      selected.length < 1 ||
      selected.length > FEED_CONFIG.onboardingMaxSelected
    ) {
      return res.status(400).json({
        message: `১ থেকে ${FEED_CONFIG.onboardingMaxSelected}টা বিষয় বাছুন`,
      });
    }

    const [doc, profile] = await Promise.all([
      UserInterest.findOne({ userId }).select("selected").lean(),
      getInterestProfile(userId),
    ]);

    const previous = doc?.selected || [];
    const added = selected.filter((c) => !previous.includes(c));
    const removed = previous.filter((c) => !selected.includes(c));
    const weight = FEED_CONFIG.eventWeights.onboarding;

    const amounts = {};
    // নতুন বাছা বিষয়ে শুরুর নম্বর
    added.forEach((c) => {
      amounts[c] = weight;
    });
    // বাদ দেওয়া বিষয়ে আগে যোগ হওয়া নম্বর ফেরত (বর্তমান নম্বরের বেশি কমানো হয় না)
    removed.forEach((c) => {
      const current = Math.max(0, profile.scores[c] || 0);
      amounts[c] = -Math.min(weight, current);
    });

    await incrementInterest(userId, amounts);
    await UserInterest.updateOne(
      { userId },
      { $set: { selected, updatedAt: new Date() } },
      { upsert: true },
    );

    return res.json({ success: true, selected });
  } catch (err) {
    console.error("Set interests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== RESET MY INTERESTS =====================
// DELETE /feed/interests
export const resetMyInterests = async (req, res) => {
  try {
    await UserInterest.deleteOne({ userId: req.user.id });
    return res.json({ success: true, message: "আগ্রহ রিসেট হয়েছে" });
  } catch (err) {
    console.error("Reset interests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== NOT INTERESTED =====================
// POST /feed/not-interested   body: { postId }
export const markNotInterested = async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Valid postId is required" });
    }

    // post ৯০ দিন ফিডে আসবে না, আর ওই বিষয়ের নম্বর কমবে
    await trackInterest(req.user.id, postId, "not_interested");

    return res.json({ success: true });
  } catch (err) {
    console.error("Not interested error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
