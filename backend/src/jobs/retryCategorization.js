import Post from "../models/postmodel.js";
import {
  DEFAULT_CATEGORIES,
  categorizePost,
} from "../helpers/moderation/categorizePost.js";
import {
  CATEGORIZE_MAX_RETRIES,
  CATEGORIZE_RETRY_DELAY_MS,
  applyAnalysis,
  getTextForAnalysis,
} from "../helpers/moderation/postModeration.js";

const TICK_MS = 60 * 1000; // প্রতি মিনিটে একবার দেখবে
const BATCH_SIZE = 10; // এক রাউন্ডে সর্বোচ্চ কয়টা post
const LEASE_MS = 10 * 60 * 1000; // post "ধরা" থাকবে, যাতে একই post দুবার প্রসেস না হয়

const SKIP_STATUSES = ["deleted", "removed"];

let running = false;

// সময় হয়ে যাওয়া একটা post atomically "দখল" করে আনে
// (একসাথে দুটো server চললেও একই post দুবার প্রসেস হবে না)
function claimNext() {
  const now = new Date();

  return Post.findOneAndUpdate(
    { categorizationStatus: "retry", categorizeRetryAt: { $lte: now } },
    {
      $set: { categorizeRetryAt: new Date(now.getTime() + LEASE_MS) },
      $inc: { categorizationAttempts: 1 },
    },
    { sort: { categorizeRetryAt: 1 }, new: true },
  )
    .select(
      "postType content.title content.text question.questionText course.title course.description moderationStatus categorizationAttempts",
    )
    .lean();
}

async function markDone(postId) {
  await Post.updateOne(
    { _id: postId },
    { $set: { categorizationStatus: "done", categorizeRetryAt: null } },
  );
}

async function processPost(post) {
  // মুছে ফেলা post-এ আর কাজ নেই
  if (SKIP_STATUSES.includes(post.moderationStatus)) {
    await markDone(post._id);
    return;
  }

  // text মুছে ফেলা হয়ে থাকলে Gemini লাগবে না
  const text = getTextForAnalysis(post);
  if (!text) {
    await Post.updateOne(
      { _id: post._id },
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

  // সফল: categories বসবে, খারাপ কিছু থাকলে auto_hidden
  if (!analysis.failed) {
    await applyAnalysis(post._id, analysis);
    return;
  }

  // সর্বোচ্চ চেষ্টার পরেও ব্যর্থ: আর চেষ্টা নয়
  if (post.categorizationAttempts >= CATEGORIZE_MAX_RETRIES) {
    await Post.updateOne(
      { _id: post._id },
      { $set: { categorizationStatus: "failed", categorizeRetryAt: null } },
    );
    // আগে কোনো category না থাকলে default বসানো (থাকলে ছোঁয়া হয় না)
    await Post.updateOne(
      { _id: post._id, categories: { $size: 0 } },
      { $set: { categories: [...DEFAULT_CATEGORIES] } },
    );
    console.error(
      `Categorization শেষ পর্যন্ত ব্যর্থ, post: ${post._id} (${post.categorizationAttempts} বার চেষ্টা)`,
    );
    return;
  }

  // আরও ৫ মিনিট পরে আবার
  await Post.updateOne(
    { _id: post._id },
    {
      $set: {
        categorizeRetryAt: new Date(Date.now() + CATEGORIZE_RETRY_DELAY_MS),
      },
    },
  );
}

async function tick() {
  if (running) return; // আগের রাউন্ড শেষ না হলে নতুন রাউন্ড নয়
  running = true;

  try {
    for (let i = 0; i < BATCH_SIZE; i++) {
      const post = await claimNext();
      if (!post) break;

      try {
        await processPost(post);
      } catch (err) {
        // এই post-এর "ধরা" সময় শেষ হলে (১০ মিনিট) আবার আসবে
        console.error(
          `Categorization retry error, post: ${post._id}:`,
          err.message,
        );
      }
    }
  } catch (err) {
    console.error("Categorization retry job error:", err.message);
  } finally {
    running = false;
  }
}

export function startCategorizationRetryJob() {
  const timer = setInterval(tick, TICK_MS);
  timer.unref?.();
  console.log("Categorization retry job চালু হয়েছে");
}
