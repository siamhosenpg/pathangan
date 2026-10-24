import cron from "node-cron";
import mongoose from "mongoose";
import User from "../models/usermodel.js";
import Post from "../models/postmodel.js";
import Handout from "../models/handoutModel.js";
import Chapter from "../models/chapterModel.js";
import Reaction from "../models/reactionModel.js";
import Follow from "../models/followModel.js";
import Block from "../models/blockModel.js";
import Answer from "../models/answer/answerModel.js";
// ⚠️ নিচের পাঁচটার পাথ আপনার প্রজেক্ট অনুযায়ী বদলান
import Comment from "../models/commentsModel.js";
import SavedItem from "../models/savesystem/savedItemSchema.js";
import SavedCollection from "../models/savesystem/savedCollectionSchema.js";
import { Notification } from "../models/notification/notificationmodel.js";
import Rating from "../models/rating/ratingModel.js";
import { syncHandoutRatingStats } from "../controllers/rating/chapterRatingController.js";

// ===================== সময়সীমা (.env থেকে) =====================
// ACCOUNT_PURGE_DAYS : soft delete হওয়া অ্যাকাউন্ট কত দিন পর মুছবে (ডিফল্ট ২)
// CONTENT_PURGE_DAYS : soft delete হওয়া post/handout/answer/chapter কত দিন পর মুছবে (ডিফল্ট ২)
const getDays = (envName) => {
  const days = Number(process.env[envName]);
  return Number.isFinite(days) && days > 0 ? days : 2;
};

const cutoffFor = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const toIds = (docs) => docs.map((d) => d._id);

// ===================== ছোট helper: কনটেন্টের সাথে জড়ানো ডেটা =====================

// post / handout / answer এর id দিয়ে comment, like, save, notification মোছে
// (postId ফিল্ডে handout বা answer এর id থাকলেও কাজ করে, না থাকলে কিছু মোছে না)
const purgeEngagement = async (targetIds) => {
  if (targetIds.length === 0) return;

  const comments = await Comment.find({ postId: { $in: targetIds } })
    .select("_id")
    .lean();
  const commentIds = toIds(comments);

  await Comment.deleteMany({ postId: { $in: targetIds } });
  await Reaction.deleteMany({ postId: { $in: targetIds } });
  await SavedItem.deleteMany({ postId: { $in: targetIds } });

  await Notification.deleteMany({
    $or: [
      { "target.postId": { $in: targetIds } },
      ...(commentIds.length > 0
        ? [{ "target.commentId": { $in: commentIds } }]
        : []),
    ],
  });
};

// ===================== কনটেন্ট মোছার ফাংশন =====================

const purgeAnswers = async (answerIds) => {
  if (answerIds.length === 0) return;

  await Rating.deleteMany({ answerId: { $in: answerIds } });
  await purgeEngagement(answerIds); // answer এর নিচে comment থাকলে
  await Answer.deleteMany({ _id: { $in: answerIds } });
};

const purgePosts = async (postIds) => {
  if (postIds.length === 0) return;

  // প্রশ্নের নিচের সব answer ও তাদের rating
  const answers = await Answer.find({ questionId: { $in: postIds } })
    .select("_id")
    .lean();
  await purgeAnswers(toIds(answers));

  // answer rating এ questionId দিয়েও জড়ানো, বাকি থাকলে সাফ
  await Rating.deleteMany({ questionId: { $in: postIds } });

  await purgeEngagement(postIds);
  await Post.deleteMany({ _id: { $in: postIds } });
};

const purgeHandouts = async (handoutIds) => {
  if (handoutIds.length === 0) return;

  await Rating.deleteMany({ handoutId: { $in: handoutIds } });
  await purgeEngagement(handoutIds);
  await Chapter.deleteMany({ handout: { $in: handoutIds } });
  await Handout.deleteMany({ _id: { $in: handoutIds } });
};

// আলাদাভাবে soft delete হওয়া chapter (handout টিকে আছে)
const purgeChapters = async (chapters) => {
  if (chapters.length === 0) return;

  const chapterIds = toIds(chapters);
  const handoutIds = [...new Set(chapters.map((c) => c.handout.toString()))];

  await Rating.deleteMany({ chapterId: { $in: chapterIds } });
  await Chapter.deleteMany({ _id: { $in: chapterIds } });

  // handout টিকে থাকলে তার average rating আবার হিসাব
  for (const handoutId of handoutIds) {
    try {
      const exists = await Handout.exists({ _id: handoutId });
      if (exists) await syncHandoutRatingStats(handoutId);
    } catch (err) {
      console.error("[purge] rating sync ব্যর্থ:", err.message);
    }
  }
};

// ===================== ১. soft delete হওয়া কনটেন্ট =====================

export const purgeDeletedContent = async () => {
  const cutoff = cutoffFor(getDays("CONTENT_PURGE_DAYS"));

  // post / question / course (শুধু user নিজে ডিলিট করলে, admin removed নয়)
  const posts = await Post.find({
    moderationStatus: "deleted",
    deletedAt: { $ne: null, $lte: cutoff },
  })
    .select("_id")
    .lean();
  await purgePosts(toIds(posts));

  // handout (সাথে তার chapter)
  const handouts = await Handout.find({
    isDeleted: true,
    deletedAt: { $ne: null, $lte: cutoff },
  })
    .select("_id")
    .lean();
  await purgeHandouts(toIds(handouts));

  // আলাদাভাবে ডিলিট হওয়া chapter
  const chapters = await Chapter.find({
    isDeleted: true,
    deletedAt: { $ne: null, $lte: cutoff },
  })
    .select("_id handout")
    .lean();
  await purgeChapters(chapters);

  // আলাদাভাবে ডিলিট হওয়া answer
  const answers = await Answer.find({
    isDeleted: true,
    deletedAt: { $ne: null, $lte: cutoff },
  })
    .select("_id")
    .lean();
  await purgeAnswers(toIds(answers));

  const total =
    posts.length + handouts.length + chapters.length + answers.length;
  if (total > 0) {
    console.log(
      `[purge] কনটেন্ট মোছা হলো: post ${posts.length}, handout ${handouts.length}, chapter ${chapters.length}, answer ${answers.length}`,
    );
  }
};

// ===================== ২. soft delete হওয়া অ্যাকাউন্ট =====================

// একজন ইউজারকে সম্পূর্ণ মুছে ফেলে
// সবশেষে User মুছি, তাই মাঝপথে ব্যর্থ হলে পরের বার আবার চেষ্টা হবে
const purgeOneUser = async (user) => {
  const userId = user._id;

  // ── ১. তার post / question / course ও সাথের সব ডেটা ──
  const posts = await Post.find({ userid: userId }).select("_id").lean();
  await purgePosts(toIds(posts));

  // ── ২. তার handout ও chapter ও সাথের সব ডেটা ──
  const handouts = await Handout.find({ user: userId }).select("_id").lean();
  await purgeHandouts(toIds(handouts));

  // ── ৩. অন্যের post এ তার দেওয়া like: মুছে like সংখ্যা ঠিক করা ──
  const reactions = await Reaction.find({ userId }).select("postId").lean();

  if (reactions.length > 0) {
    const likeOps = reactions.map((r) => ({
      updateOne: {
        filter: { _id: r.postId },
        update: { $inc: { likesCount: -1 } },
      },
    }));
    await Post.bulkWrite(likeOps);
    await Handout.bulkWrite(likeOps);
    await Reaction.deleteMany({ userId });
  }

  // ── ৪. answer এ তার দেওয়া upvote / downvote সরানো ──
  await Answer.updateMany(
    { upvotes: userId },
    { $pull: { upvotes: userId }, $inc: { upvotesCount: -1 } },
  );
  await Answer.updateMany(
    { downvotes: userId },
    { $pull: { downvotes: userId }, $inc: { downvotesCount: -1 } },
  );

  // ── ৫. তার saved item ও collection ──
  await SavedItem.deleteMany({ userId });
  await SavedCollection.deleteMany({ userId });

  // ── ৬. তাকে নিয়ে বা তার জন্য তৈরি notification ──
  await Notification.deleteMany({
    $or: [{ userId }, { actorId: userId }],
  });

  // ── ৭. follow সম্পর্ক ও অন্যদের follower/following সংখ্যা ঠিক করা ──
  const follows = await Follow.find({
    $or: [{ followerId: userId }, { followingId: userId }],
  })
    .select("followerId followingId")
    .lean();

  const statOps = follows.map((f) =>
    f.followerId.toString() === userId.toString()
      ? {
          // সে অন্য কাউকে follow করত → ওই ব্যক্তির follower কমবে
          updateOne: {
            filter: { _id: f.followingId },
            update: { $inc: { "activityStats.totalFollowers": -1 } },
          },
        }
      : {
          // কেউ তাকে follow করত → ওই ব্যক্তির following কমবে
          updateOne: {
            filter: { _id: f.followerId },
            update: { $inc: { "activityStats.totalFollowing": -1 } },
          },
        },
  );
  if (statOps.length > 0) await User.bulkWrite(statOps);

  await Follow.deleteMany({
    $or: [{ followerId: userId }, { followingId: userId }],
  });

  // ── ৮. block সম্পর্ক ──
  await Block.deleteMany({
    $or: [{ blocker: userId }, { blocked: userId }],
  });

  // ── ৯. সবশেষে ইউজার নিজে ──
  // নোট: অন্যের post এ তার comment ও answer থাকবে, লেখক মুছে যাওয়ায়
  // frontend এ "ডিলিট হওয়া ইউজার" দেখাবে
  await User.deleteOne({ _id: userId, accountStatus: "deleted" });
};

export const purgeDeletedAccounts = async () => {
  const days = getDays("ACCOUNT_PURGE_DAYS");

  const users = await User.find({
    accountStatus: "deleted",
    deletedAt: { $ne: null, $lte: cutoffFor(days) },
  })
    .select("_id username")
    .lean();

  if (users.length === 0) return;

  console.log(
    `[purge] ${users.length} টি অ্যাকাউন্ট মুছতে হবে (${days} দিনের পুরনো)`,
  );

  for (const user of users) {
    try {
      await purgeOneUser(user);
      console.log(`[purge] মুছে গেছে: ${user.username}`);
    } catch (err) {
      // একজনের সমস্যায় বাকিরা আটকাবে না, পরের রানে আবার চেষ্টা হবে
      console.error(`[purge] ব্যর্থ: ${user.username}`, err.message);
    }
  }
};

// ===================== সব একসাথে =====================

let running = false;

export const runAllPurges = async () => {
  // আগের রান শেষ না হলে নতুন রান শুরু হবে না
  if (running) return;
  running = true;

  try {
    // আগে অ্যাকাউন্ট, পরে বাকি soft delete কনটেন্ট
    await purgeDeletedAccounts();
    await purgeDeletedContent();
  } catch (err) {
    console.error("[purge] job error:", err.message);
  } finally {
    running = false;
  }
};

// প্রতি ঘণ্টায় একবার, আর সার্ভার চালু হওয়ার ৩০ সেকেন্ড পর একবার
// (Render এ সার্ভার ঘুমিয়ে থাকলে জেগে ওঠার পরেই কাজটা সেরে ফেলা যায়)
export const startAccountPurgeJob = () => {
  cron.schedule("0 * * * *", () => {
    runAllPurges();
  });

  setTimeout(() => {
    if (mongoose.connection.readyState === 1) runAllPurges();
  }, 30 * 1000);

  console.log(
    `[purge] job চালু (অ্যাকাউন্ট: ${getDays("ACCOUNT_PURGE_DAYS")} দিন, কনটেন্ট: ${getDays("CONTENT_PURGE_DAYS")} দিন)`,
  );
};
