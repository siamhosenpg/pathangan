import mongoose from "mongoose";
import Post from "../../models/postmodel.js";
import { FEED_CONFIG } from "../../helpers/feed/feedConfig.js";
import { trackInterestForPost } from "../../helpers/feed/trackInterest.js";

const MAX_ITEMS = 40;
const MAX_DWELL_MS = 10 * 60 * 1000; // অস্বাভাবিক মান কেটে দেওয়া

async function processImpressions(userId, items) {
  const posts = await Post.find({ _id: { $in: items.map((i) => i.postId) } })
    .select("userid categories moderationStatus")
    .lean();
  const postMap = new Map(posts.map((p) => [String(p._id), p]));

  for (const item of items) {
    const post = postMap.get(item.postId);
    if (!post) continue;

    if (item.dwellMs >= FEED_CONFIG.viewDwellMs) {
      await trackInterestForPost(userId, post, "view");
    }

    const deep =
      item.watchRatio >= FEED_CONFIG.deepViewWatchRatio ||
      item.dwellMs >= FEED_CONFIG.deepViewDwellMs;
    if (deep) {
      await trackInterestForPost(userId, post, "deep_view");
    }
  }
}

// ===================== RECORD IMPRESSIONS =====================
// POST /feed/impressions
// body: { items: [{ postId, dwellMs, watchRatio? }] }
// Expo থেকে জমিয়ে একসাথে পাঠানো হবে। সঙ্গে সঙ্গে উত্তর দেয়, কাজ background-এ চলে
export const recordImpressions = async (req, res) => {
  const userId = req.user.id;
  const raw = Array.isArray(req.body?.items) ? req.body.items : [];

  const seen = new Set();
  const items = [];

  for (const entry of raw.slice(0, MAX_ITEMS)) {
    const postId = String(entry?.postId || "");
    if (!mongoose.Types.ObjectId.isValid(postId) || seen.has(postId)) continue;
    seen.add(postId);

    items.push({
      postId,
      dwellMs: Math.min(Math.max(Number(entry.dwellMs) || 0, 0), MAX_DWELL_MS),
      watchRatio: Math.min(Math.max(Number(entry.watchRatio) || 0, 0), 1),
    });
  }

  res.status(202).json({ success: true, accepted: items.length });

  if (items.length === 0) return;

  processImpressions(userId, items).catch((err) =>
    console.error("Impression processing error:", err.message),
  );
};
