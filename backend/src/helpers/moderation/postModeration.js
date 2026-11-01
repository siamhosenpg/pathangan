import Post from "../../models/postmodel.js";
import { categorizePost, DEFAULT_CATEGORIES } from "./categorizePost.js";

// system নিজে (local filter / AI) hide করলে history-তে এই reason থাকে
const AUTO_FLAG_REASONS = ["local_filter", "ai_flagged"];

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

// post save হওয়ার পরে background-এ category বের করে update করে
// response আটকায় না, এবং কখনো throw করে না
export function categorizeInBackground(postId, text) {
  (async () => {
    try {
      const analysis = await categorizePost(text);

      await Post.updateOne(
        { _id: postId },
        { $set: { categories: analysis.categories } },
      );

      // Gemini flag করলে (শুধু active থাকলে) auto_hidden
      if (analysis.flagged) {
        await Post.updateOne(
          { _id: postId, moderationStatus: "active" },
          {
            $set: { moderationStatus: "auto_hidden" },
            $push: {
              moderationHistory: flagEntry("ai_flagged", analysis.flagType),
            },
          },
        );
      }
    } catch (err) {
      console.error("Background categorize error:", err.message);
    }
  })();
}

export { categorizePost, DEFAULT_CATEGORIES };
