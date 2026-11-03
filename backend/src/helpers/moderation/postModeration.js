import Post from "../../models/postmodel.js";
import { categorizePost, DEFAULT_CATEGORIES } from "./categorizePost.js";

// system নিজে (local filter / AI) hide করলে history-তে এই reason থাকে
const AUTO_FLAG_REASONS = ["local_filter", "ai_flagged"];

// Gemini ব্যর্থ হলে কত পরে আবার চেষ্টা, আর job সর্বোচ্চ কতবার চেষ্টা করবে
export const CATEGORIZE_RETRY_DELAY_MS = 5 * 60 * 1000; // ৫ মিনিট
export const CATEGORIZE_MAX_RETRIES = 5;

// post-এর type অনুযায়ী যাচাই করার text বের করা
export function getTextForAnalysis(post) {
  let parts = [];

  if (post.postType === "question") {
    parts = [post.question?.questionText];
  } else if (post.postType === "course") {
    parts = [post.course?.title, post.course?.description];
  } else {
    parts = [post.content?.title, post.content?.text];
  }

  return parts.filter((t) => typeof t === "string" && t.trim()).join("\n");
}

// system নিজে auto_hidden করেছে কিনা (admin বা report-এর কারণে হলে false)
export function isAutoFlagged(post) {
  if (post.moderationStatus !== "auto_hidden") return false;

  const history = post.moderationHistory || [];
  const last = history[history.length - 1];

  return (
    !!last &&
    last.status === "auto_hidden" &&
    AUTO_FLAG_REASONS.includes(last.reason)
  );
}

// moderationHistory-র জন্য entry
export function flagEntry(reason, flagType) {
  return {
    status: "auto_hidden",
    changedBy: null,
    changedAt: new Date(),
    reason,
    note: flagType,
  };
}

// "৫ মিনিট পরে category বের করো" চিহ্ন
// post save করার সময় বা text বদলানোর সময় document-এ বসাতে হবে।
// background কাজ মাঝপথে থেমে গেলেও (server restart) job এটা দেখে ধরে নেবে
export function pendingCategorization() {
  return {
    categorizationStatus: "retry",
    categorizationAttempts: 0,
    categorizeRetryAt: new Date(Date.now() + CATEGORIZE_RETRY_DELAY_MS),
  };
}

// Gemini-র সফল ফল post-এ বসানো। flag করলে (hide করার মতো অবস্থায় থাকলে) auto_hidden
export async function applyAnalysis(postId, analysis) {
  await Post.updateOne(
    { _id: postId },
    {
      $set: {
        categories: analysis.categories,
        categorizationStatus: "done",
        categorizeRetryAt: null,
      },
    },
  );

  if (analysis.flagged) {
    await Post.updateOne(
      {
        _id: postId,
        moderationStatus: { $in: ["active", "under_review"] },
      },
      {
        $set: { moderationStatus: "auto_hidden" },
        $push: {
          moderationHistory: flagEntry("ai_flagged", analysis.flagType),
        },
      },
    );
  }
}

// ৫ মিনিট পরে আবার চেষ্টার সময় ঠিক করা
export async function scheduleRetry(postId) {
  await Post.updateOne(
    { _id: postId },
    {
      $set: {
        categorizationStatus: "retry",
        categorizeRetryAt: new Date(Date.now() + CATEGORIZE_RETRY_DELAY_MS),
      },
    },
  );
}

// post save হওয়ার পরে background-এ category বের করে update করে
// response আটকায় না, এবং কখনো throw করে না
export function categorizeInBackground(postId, text) {
  (async () => {
    try {
      const analysis = await categorizePost(text);

      // Gemini ব্যর্থ: categories ছুঁই না, ৫ মিনিট পরে job আবার চেষ্টা করবে
      if (analysis.failed) {
        await scheduleRetry(postId);
        return;
      }

      await applyAnalysis(postId, analysis);
    } catch (err) {
      // database সমস্যা হলে "retry" চিহ্ন আগে থেকেই আছে, job ধরে নেবে
      console.error("Background categorize error:", err.message);
    }
  })();
}

export { categorizePost, DEFAULT_CATEGORIES };
