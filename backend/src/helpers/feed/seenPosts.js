import mongoose from "mongoose";
import SeenPost from "../../models/feed/seenPostModel.js";
import { DAY, FEED_CONFIG } from "./feedConfig.js";

// এই user-এর সাম্প্রতিক দেখা ও "আগ্রহী নই" করা post-এর ID
export async function getSeenPostIds(userId) {
  if (!userId) return [];

  const docs = await SeenPost.find({ userId })
    .sort({ lastSeenAt: -1 })
    .limit(FEED_CONFIG.maxSeenIds)
    .select("postId")
    .lean();

  return docs.map((d) => d.postId);
}

// ফিডে দেখানো post গুলো "দেখা" হিসেবে চিহ্নিত করা
export async function markPostsSeen(userId, postIds) {
  if (!userId || !postIds?.length) return;

  const uid = new mongoose.Types.ObjectId(String(userId));
  const now = new Date();
  const expireAt = new Date(now.getTime() + FEED_CONFIG.seenTtlDays * DAY);

  await SeenPost.bulkWrite(
    postIds.map((postId) => ({
      updateOne: {
        filter: { userId: uid, postId },
        update: {
          $set: { lastSeenAt: now },
          // "আগ্রহী নই" করা post-এর বড় মেয়াদ যেন কমে না যায়
          $max: { expireAt },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}

// background-এ চালানোর জন্য (কখনো throw করে না)
export function markPostsSeenInBackground(userId, postIds) {
  markPostsSeen(userId, postIds).catch((err) =>
    console.error("markPostsSeen error:", err.message),
  );
}
