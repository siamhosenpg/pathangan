import Post from "../../models/postmodel.js";
import { categorizePost, DEFAULT_CATEGORIES } from "./categorizePost.js";

// system নিজে (local filter / AI) hide করলে history-তে এই reason থাকে
const AUTO_FLAG_REASONS = ["local_filter", "ai_flagged"];

// Gemini ব্যর্থ হলে কত পরে আবার চেষ্টা, আর job সর্বোচ্চ কতবার চেষ্টা করবে
export const CATEGORIZE_RETRY_DELAY_MS = 5 * 60 * 1000; // ৫ মিনিট
export const CATEGORIZE_MAX_RETRIES = 5;

const ANALYSIS_FIELDS =
  "postType content.title content.text question.questionText course.title course.description";

const joinText = (parts) =>
  parts.filter((t) => typeof t === "string" && t.trim()).join("\n");

// post-এর type অনুযায়ী Gemini-তে যাচাই করার text
export function getTextForAnalysis(post) {
  if (post.postType === "question") {
    return joinText([post.question?.questionText]);
  }
  if (post.postType === "course") {
    return joinText([post.course?.title, post.course?.description]);
  }
  return joinText([post.content?.title, post.content?.text]);
}

// local filter-এ যাচাই করার text: মূল লেখা + tags, location, mentions
export function getLocalCheckText(post) {
  const extra = [];
  const push = (v) => {
    if (Array.isArray(v)) extra.push(...v);
    else extra.push(v);
  };

  if (post.postType === "question") {
    push(post.question?.tags);
  } else if (post.postType === "course") {
    push(post.course?.tags);
  } else {
    push(post.content?.tags);
    push(post.content?.location);
    push(post.content?.mentions);
  }

  return joinText([getTextForAnalysis(post), ...extra]);
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
export function pendingCategorization() {
  return {
    categorizationStatus: "retry",
    categorizationAttempts: 0,
    categorizeRetryAt: new Date(Date.now() + CATEGORIZE_RETRY_DELAY_MS),
  };
}

// analysis করার পরে post-এর text এখনো একই আছে কিনা
// (এর মধ্যে user edit করে ফেললে পুরোনো ফল বসানো যাবে না)
async function isTextCurrent(postId, text) {
  const fresh = await Post.findById(postId).select(ANALYSIS_FIELDS).lean();
  if (!fresh) return false;
  return getTextForAnalysis(fresh) === text;
}

// Gemini-র সফল ফল post-এ বসানো। flag করলে (hide করার মতো অবস্থায় থাকলে) auto_hidden
// text দিলে text বদলে গেছে কিনা দেখে নেয়। ফেরত দেয়: বসানো হলে true
export async function applyAnalysis(postId, analysis, text) {
  if (text !== undefined && !(await isTextCurrent(postId, text))) {
    return false;
  }

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

  return true;
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
// text সবসময় database থেকে নতুন করে পড়া হয়, তাই দ্রুত পরপর edit করলেও পুরোনো ফল বসে না
// response আটকায় না, এবং কখনো throw করে না
export function categorizeInBackground(postId) {
  (async () => {
    try {
      const post = await Post.findById(postId).select(ANALYSIS_FIELDS).lean();
      if (!post) return;

      const text = getTextForAnalysis(post);

      if (!text) {
        await Post.updateOne(
          { _id: postId },
          {
            $set: {
              categories: [...DEFAULT_CATEGORIES],
              categorizationStatus: "done",
              categorizeRetryAt: null,
            },
          },
        );
        return;
      }

      const analysis = await categorizePost(text);

      // Gemini ব্যর্থ: categories ছুঁই না, ৫ মিনিট পরে job আবার চেষ্টা করবে
      if (analysis.failed) {
        await scheduleRetry(postId);
        return;
      }

      await applyAnalysis(postId, analysis, text);
    } catch (err) {
      // database সমস্যা হলে "retry" চিহ্ন আগে থেকেই আছে, job ধরে নেবে
      console.error("Background categorize error:", err.message);
    }
  })();
}

export { categorizePost, DEFAULT_CATEGORIES };
