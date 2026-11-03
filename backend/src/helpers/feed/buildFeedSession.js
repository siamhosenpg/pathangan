import Follow from "../../models/followModel.js";
import FeedSession from "../../models/feed/feedSessionModel.js";
import { getBlockedUserIds } from "../blockHelper.js";
import { FEED_CONFIG } from "./feedConfig.js";
import { getSeenPostIds } from "./seenPosts.js";
import { getInterestProfile } from "./trackInterest.js";
import { fetchCandidates } from "./candidateSources.js";
import { rankPosts } from "./rankPosts.js";

// ===================== কোন উৎস কত ভাগ =====================
function computeWeights({ profile, hasFollowing, loggedIn }) {
  const mix = FEED_CONFIG.mix;
  const weights = {};

  if (!loggedIn) {
    // guest
    weights.trending = mix.guest.trending;
    weights.explore = mix.guest.explore;
  } else if (profile.top.length === 0) {
    // নতুন user, এখনো আগ্রহ জমেনি
    if (hasFollowing) {
      weights.following = mix.coldStart.following;
      weights.trending = mix.coldStart.trending;
      weights.explore = mix.coldStart.explore;
    } else {
      weights.trending = mix.coldStartNoFollow.trending;
      weights.explore = mix.coldStartNoFollow.explore;
    }
  } else {
    // আগ্রহ যত বেশি জমেছে, আগ্রহ-ভিত্তিক post-এর ভাগ তত বাড়ে
    const strength = Math.min(
      1,
      profile.totalPositive / FEED_CONFIG.profile.strengthFullScore,
    );
    const interestTotal =
      mix.interestMin + (mix.interestMax - mix.interestMin) * strength;

    // বেশি আগ্রহের বিষয় আরও বেশি ভাগ পায়
    const sharp = FEED_CONFIG.profile.shareSharpness;
    const raw = profile.top.map((c) => Math.pow(c.score, sharp));
    const rawSum = raw.reduce((sum, r) => sum + r, 0);

    let assigned = 0;
    profile.top.forEach((c, i) => {
      let weight = interestTotal * (raw[i] / rawSum);
      // একটা বিষয় ৬০%-এর বেশি জায়গা পাবে না
      if (i === 0) weight = Math.min(weight, mix.topCategoryCap);
      weights[`interest:${c.category}`] = weight;
      assigned += weight;
    });

    const following = hasFollowing ? mix.following : 0;
    if (following > 0) weights.following = following;

    // বাকি জায়গা: জনপ্রিয় ও নতুন বিষয়
    const spare = Math.max(0, 1 - assigned - following);
    weights.trending = spare * mix.trendingOfSpare;
    weights.explore = spare * (1 - mix.trendingOfSpare);
  }

  weights.latest = mix.latestFiller;
  return weights;
}

// ===================== ভাগ অনুযায়ী মিশিয়ে সাজানো =====================
// smooth weighted round-robin: প্রতি ১০টার মধ্যেও ভাগ ঠিক থাকে।
// কোনো উৎসের post ফুরিয়ে গেলে তার ভাগ বাকিদের মধ্যে আপনাআপনি ছড়িয়ে যায়
function interleave(queues, weights, size) {
  const { maxConsecutiveSource, authorCooldown } = FEED_CONFIG.diversity;

  const keys = Object.keys(queues).filter((k) => (weights[k] || 0) > 0);
  const current = Object.fromEntries(keys.map((k) => [k, 0]));
  const used = new Set();
  const recentAuthors = [];
  const result = [];

  const hasNext = (key) => {
    const q = queues[key];
    while (q.length > 0 && used.has(String(q[0]._id))) q.shift();
    return q.length > 0;
  };

  // একই লেখকের post কাছাকাছি এলে অন্য লেখকেরটা আগে নেওয়া
  const takeNext = (key) => {
    const q = queues[key];
    let idx = q.findIndex(
      (p) =>
        !used.has(String(p._id)) && !recentAuthors.includes(String(p.userid)),
    );
    if (idx === -1) idx = q.findIndex((p) => !used.has(String(p._id)));
    if (idx === -1) return null;
    return q.splice(idx, 1)[0];
  };

  let active = keys.filter((k) => hasNext(k));
  let lastKey = null;
  let run = 0;

  while (result.length < size && active.length > 0) {
    const total = active.reduce((sum, k) => sum + weights[k], 0);
    active.forEach((k) => {
      current[k] += weights[k];
    });

    const ordered = [...active].sort((a, b) => current[b] - current[a]);
    let pick = ordered[0];

    // একই উৎস পরপর অনেকবার নয়
    if (pick === lastKey && run >= maxConsecutiveSource && ordered.length > 1) {
      pick = ordered[1];
    }
    current[pick] -= total;

    const post = takeNext(pick);
    if (post) {
      used.add(String(post._id));
      result.push(post._id);

      recentAuthors.push(String(post.userid));
      if (recentAuthors.length > authorCooldown) recentAuthors.shift();

      run = pick === lastKey ? run + 1 : 1;
      lastKey = pick;
    }

    active = active.filter((k) => hasNext(k));
  }

  return result;
}

// ===================== মূল function =====================
// ফেরত দেয়: { session: { _id, postIds }, debug }
export async function buildFeedSession({
  userId = null,
  excludeIds = [],
  ignoreSeen = false,
} = {}) {
  const now = Date.now();

  const [blockedIds, seenIds, profile, followDocs] = await Promise.all([
    getBlockedUserIds(userId),
    userId && !ignoreSeen ? getSeenPostIds(userId) : Promise.resolve([]),
    getInterestProfile(userId),
    userId
      ? Follow.find({ followerId: userId }).select("followingId").lean()
      : Promise.resolve([]),
  ]);

  // blocked user-দের follow তালিকা থেকে বাদ
  const blockedSet = new Set(blockedIds.map(String));
  const followingIds = followDocs
    .map((f) => f.followingId)
    .filter((id) => !blockedSet.has(String(id)));
  const followingSet = new Set(followingIds.map(String));

  const allExclude = [...seenIds, ...excludeIds];

  const candidates = await fetchCandidates({
    profile,
    blockedIds,
    excludeIds: allExclude,
    followingIds,
  });

  // নম্বর দিয়ে প্রতিটা উৎসের post সাজানো
  const ctx = { norm: profile.norm, followingSet, now };
  const queues = {};

  candidates.interest.forEach(({ category, posts }) => {
    queues[`interest:${category}`] = rankPosts(posts, ctx);
  });
  queues.following = rankPosts(candidates.following, ctx);
  queues.trending = rankPosts(candidates.trending, ctx);
  queues.explore = rankPosts(candidates.explore, ctx, {
    jitter: FEED_CONFIG.rank.exploreJitter,
  });
  queues.latest = rankPosts(candidates.latest, ctx);

  const weights = computeWeights({
    profile,
    hasFollowing: followingIds.length > 0,
    loggedIn: !!userId,
  });

  const postIds = interleave(queues, weights, FEED_CONFIG.session.size);

  // কিছু না পেলে session বানানোর দরকার নেই
  let session = { _id: null, postIds: [] };
  if (postIds.length > 0) {
    const created = await FeedSession.create({ userId, postIds });
    session = { _id: created._id, postIds };
  }

  // শুধু admin-এর জন্য: কেন এই ফিড হলো
  const debug = {
    topInterests: profile.top.map((c) => ({
      category: c.category,
      score: Number(c.score.toFixed(2)),
    })),
    avoid: profile.avoid,
    weights: Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, Number(v.toFixed(3))]),
    ),
    candidates: Object.fromEntries(
      Object.entries(queues).map(([k, v]) => [k, v.length]),
    ),
    followingCount: followingIds.length,
    excludedCount: allExclude.length,
    sessionSize: postIds.length,
  };

  return { session, debug };
}
