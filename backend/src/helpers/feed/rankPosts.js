import { FEED_CONFIG } from "./feedConfig.js";
import { getSignalCategories } from "./categoryTaxonomy.js";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// একটা post-এর নম্বর (০ থেকে প্রায় ১)
export function scorePost(post, ctx) {
  const cfg = FEED_CONFIG.rank;
  const { norm, followingSet, now } = ctx;

  const ageHours = Math.max(
    0,
    (now - new Date(post.createdAt).getTime()) / 3600000,
  );

  // নতুন post বেশি নম্বর পায়, ক্রমে কমে
  const recency = Math.pow(0.5, ageHours / cfg.recencyHalfLifeHours);

  // জনপ্রিয়তা (log মাপে, যাতে একটা ভাইরাল post সব গিলে না ফেলে)
  const engagement =
    (post.likesCount || 0) +
    2 * (post.commentsCount || 0) +
    3 * (post.sharesCount || 0) +
    0.1 * (post.viewsCount || 0);
  const popularity = Math.min(
    1,
    Math.log1p(Math.max(0, engagement)) / Math.log1p(cfg.popularityCap),
  );

  // আগ্রহের মিল (১ম category বেশি ওজন পায়)। "আগ্রহী নই" বিষয়ে ঋণাত্মক হয়
  const categories = getSignalCategories(post.categories);
  let interest = 0;
  categories.forEach((category, i) => {
    interest +=
      (norm.get(category) || 0) * (FEED_CONFIG.positionFactors[i] ?? 0.3);
  });
  interest = clamp(interest, -1, 1);

  const following = followingSet.has(String(post.userid)) ? 1 : 0;

  let score =
    cfg.wInterest * interest +
    cfg.wRecency * recency +
    cfg.wPopularity * popularity +
    cfg.wFollowing * following;

  // একদম নতুন, এখনো কেউ দেখেনি এমন post-কে প্রথম কয়েক ঘণ্টা সুযোগ দেওয়া
  if (ageHours <= cfg.freshBoostHours && popularity < 0.3) {
    score += cfg.freshBoost;
  }

  return score;
}

// নম্বর দিয়ে বেশি থেকে কম সাজানো। jitter দিলে একটু এলোমেলো (নতুন বিষয়ের জন্য)
export function rankPosts(posts, ctx, { jitter = 0 } = {}) {
  return posts
    .map((post) => ({
      ...post,
      _score: scorePost(post, ctx) + (jitter ? Math.random() * jitter : 0),
    }))
    .sort((a, b) => b._score - a._score);
}
