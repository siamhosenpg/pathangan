import mongoose from "mongoose";
import Post from "../../models/postmodel.js";
import UserInterest from "../../models/feed/userInterestModel.js";
import SeenPost from "../../models/feed/seenPostModel.js";
import { DAY, FEED_CONFIG, decayScale } from "./feedConfig.js";
import { getSignalCategories } from "./categoryTaxonomy.js";

const toId = (id) => new mongoose.Types.ObjectId(String(id));
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// ===================== আগ্রহ নম্বর বাড়ানো/কমানো =====================
// amounts: { cricket: 3, poetry: 1.8 } (আসল নম্বর, ক্ষয়ের গুণক এখানেই লাগে)
// atomic $inc, তাই একসাথে অনেক ঘটনা এলেও কিছু হারায় না
export async function incrementInterest(
  userId,
  amounts,
  { countEvent = false } = {},
) {
  const scale = decayScale(Date.now());
  const inc = {};

  for (const [category, amount] of Object.entries(amounts)) {
    if (amount) inc[`weights.${category}`] = amount * scale;
  }
  if (countEvent) inc.eventsCount = 1;
  if (Object.keys(inc).length === 0) return;

  const filter = { userId: toId(userId) };
  const update = { $inc: inc, $set: { updatedAt: new Date() } };

  try {
    await UserInterest.updateOne(filter, update, { upsert: true });
  } catch (err) {
    // দুটো request একসাথে প্রথমবার নথি বানাতে গেলে একটা ব্যর্থ হয়, আবার চেষ্টা
    if (err.code === 11000) {
      await UserInterest.updateOne(filter, update, { upsert: true });
    } else {
      throw err;
    }
  }
}

// ===================== একটা ঘটনা থেকে আগ্রহ জমানো =====================
// post আগেই লোড করা থাকলে এটা ব্যবহার করুন
// ফেরত দেয়: ঘটনাটা নতুন হলে true, আগে গোনা হয়ে থাকলে বা বাদ গেলে false
export async function trackInterestForPost(userId, post, eventType) {
  const weight = FEED_CONFIG.eventWeights[eventType];
  if (!weight || !userId || !post) return false;

  // নিজের post-এ আগ্রহ জমে না
  if (String(post.userid) === String(userId)) return false;
  if (FEED_CONFIG.hiddenStatuses.includes(post.moderationStatus)) return false;

  const now = new Date();
  const isDismiss = eventType === "not_interested";
  const ttlDays = isDismiss
    ? FEED_CONFIG.dismissTtlDays
    : FEED_CONFIG.seenTtlDays;

  // একই post + একই ঘটনা একবারই গোনা হবে (like/unlike বারবার করলেও)।
  // filter না মিললে upsert নতুন নথি বানাতে গিয়ে unique index-এ আটকায়, মানে আগেই গোনা হয়েছে
  try {
    await SeenPost.updateOne(
      {
        userId: toId(userId),
        postId: post._id,
        counted: { $ne: eventType },
      },
      {
        $addToSet: { counted: eventType },
        $set: { lastSeenAt: now, ...(isDismiss && { dismissed: true }) },
        $max: { expireAt: new Date(now.getTime() + ttlDays * DAY) },
      },
      { upsert: true },
    );
  } catch (err) {
    if (err.code === 11000) return false;
    throw err;
  }

  // বিষয়-নিরপেক্ষ (general) post আগ্রহে কিছু যোগ করে না
  const categories = getSignalCategories(post.categories);
  if (categories.length === 0) return true;

  const amounts = {};
  categories.forEach((category, i) => {
    amounts[category] = weight * (FEED_CONFIG.positionFactors[i] ?? 0.3);
  });

  await incrementInterest(userId, amounts, { countEvent: true });
  return true;
}

// postId দিয়ে (post নিজে লোড করে)
export async function trackInterest(userId, postId, eventType) {
  if (!userId || !mongoose.Types.ObjectId.isValid(postId)) return false;

  const post = await Post.findById(postId)
    .select("userid categories moderationStatus")
    .lean();

  return trackInterestForPost(userId, post, eventType);
}

// controller-এ ব্যবহারের জন্য: user-কে অপেক্ষা করায় না, কখনো throw করে না
export function trackInterestInBackground(userId, postId, eventType) {
  trackInterest(userId, postId, eventType).catch((err) =>
    console.error("trackInterest error:", err.message),
  );
}

// ===================== user-এর আগ্রহের প্রোফাইল =====================
export async function getInterestProfile(userId) {
  const empty = {
    scores: {},
    top: [], // [{ category, score }] বেশি থেকে কম
    avoid: [], // এড়ানোর category
    totalPositive: 0,
    norm: new Map(), // category → -1..1
  };

  if (!userId) return empty;

  const doc = await UserInterest.findOne({ userId }).select("weights").lean();
  if (!doc?.weights) return empty;

  const cfg = FEED_CONFIG.profile;
  const scale = decayScale(Date.now());

  const scores = {};
  for (const [category, raw] of Object.entries(doc.weights)) {
    const effective = raw / scale;
    if (Math.abs(effective) >= 0.05) scores[category] = effective;
  }

  const entries = Object.entries(scores);

  const top = entries
    .filter(([, score]) => score >= cfg.minInterestScore)
    .sort((a, b) => b[1] - a[1])
    .slice(0, cfg.topCategories)
    .map(([category, score]) => ({ category, score }));

  const avoid = entries
    .filter(([, score]) => score <= cfg.avoidScore)
    .map(([category]) => category);

  const totalPositive = entries
    .filter(([, score]) => score > 0)
    .reduce((sum, [, score]) => sum + score, 0);

  const maxPositive = top[0]?.score || 1;
  const norm = new Map(
    entries.map(([category, score]) => [
      category,
      clamp(score / maxPositive, -1, 1),
    ]),
  );

  return { scores, top, avoid, totalPositive, norm };
}
