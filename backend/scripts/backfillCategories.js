import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import Post from "../src/models/postmodel.js";
import {
  DEFAULT_CATEGORIES,
  categorizePost,
} from "../src/helpers/moderation/categorizePost.js";
import {
  applyAnalysis,
  getTextForAnalysis,
} from "../src/helpers/moderation/postModeration.js";
import { ALL_CATEGORY_SLUGS } from "../src/helpers/feed/categoryTaxonomy.js";

// চালানো:
//   node scripts/backfillCategories.js --dry --limit=20     (শুধু দেখা, কিছু লেখে না)
//   node scripts/backfillCategories.js --limit=300          (আসল কাজ, ৩০০টা)
//   node scripts/backfillCategories.js --limit=300 --hide-flagged
//        (Gemini খারাপ বললে পুরোনো post-ও auto_hidden করবে, নইলে শুধু category বসায়)
//   --delay=1500 দিলে প্রতি post-এর মাঝে ১.৫ সেকেন্ড থামবে

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [key, value] = a.replace(/^--/, "").split("=");
    return [key, value ?? true];
  }),
);

const LIMIT = parseInt(args.limit, 10) || 300;
const DELAY_MS = parseInt(args.delay, 10) || 1200;
const DRY = !!args.dry;
const HIDE_FLAGGED = !!args["hide-flagged"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// category ফাঁকা, বা তালিকার বাইরের কিছু আছে এমন post
// (retry job যেগুলো ধরে আছে সেগুলো বাদ)
const needsBackfill = {
  moderationStatus: { $nin: ["deleted", "removed"] },
  categorizationStatus: { $ne: "retry" },
  $or: [
    { categories: { $size: 0 } },
    { categories: { $elemMatch: { $nin: ALL_CATEGORY_SLUGS } } },
  ],
};

async function main() {
  await connectDB();

  const total = await Post.countDocuments(needsBackfill);
  console.log(
    `মোট ${total}টা post-এ কাজ বাকি। এই রানে সর্বোচ্চ ${LIMIT}টা${DRY ? " (dry run)" : ""}`,
  );

  let lastId = null;
  let processed = 0;
  let updated = 0;
  let noText = 0;
  let failed = 0;

  while (processed < LIMIT) {
    const filter = lastId
      ? { ...needsBackfill, _id: { $gt: lastId } }
      : needsBackfill;

    const post = await Post.findOne(filter)
      .sort({ _id: 1 })
      .select(
        "postType content.title content.text question.questionText course.title course.description",
      )
      .lean();

    if (!post) break;

    lastId = post._id;
    processed++;

    const text = getTextForAnalysis(post);

    // text নেই: নিরপেক্ষ category
    if (!text) {
      if (!DRY) {
        await Post.updateOne(
          { _id: post._id },
          { $set: { categories: [...DEFAULT_CATEGORIES] } },
        );
      }
      noText++;
      continue;
    }

    const analysis = await categorizePost(text);

    // Gemini ব্যর্থ: এই রানে ছেড়ে দেওয়া, পরের রানে আবার ধরা পড়বে
    if (analysis.failed) {
      failed++;
      await sleep(DELAY_MS);
      continue;
    }

    if (!DRY) {
      if (HIDE_FLAGGED) {
        await applyAnalysis(post._id, analysis);
      } else {
        await Post.updateOne(
          { _id: post._id },
          {
            $set: {
              categories: analysis.categories,
              categorizationStatus: "done",
              categorizeRetryAt: null,
            },
          },
        );
      }
    }

    updated++;
    console.log(
      `[${processed}/${LIMIT}] ${post._id} → ${analysis.categories.join(", ")}${
        analysis.flagged ? `  ⚠ flagged: ${analysis.flagType}` : ""
      }`,
    );

    await sleep(DELAY_MS);
  }

  console.log(
    `\nশেষ। প্রসেস: ${processed}, category বসেছে: ${updated}, text নেই: ${noText}, ব্যর্থ: ${failed}`,
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Backfill error:", err);
  await mongoose.disconnect();
  process.exit(1);
});
