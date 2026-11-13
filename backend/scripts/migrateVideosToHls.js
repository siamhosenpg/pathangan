import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Post from "../src/models/postmodel.js";

// ───────────── সেটিং ─────────────
// uploadToCloudinary.js-এর HLS_PROFILE-এর সাথে একই হতে হবে
const HLS_PROFILE = "hd";

// দুই ভিডিওর মাঝে বিরতি (ms), Cloudinary rate limit থেকে বাঁচতে
const DELAY_MS = 500;

// ───────────── আপনার .env অনুযায়ী মিলিয়ে নিন ─────────────
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ───────────── command line আর্গুমেন্ট ─────────────
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 0;
const rollbackArg = args.find((a) => a.startsWith("--rollback="));
const ROLLBACK_FILE = rollbackArg ? rollbackArg.split("=")[1] : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isHls = (url) => url.split("?")[0].toLowerCase().endsWith(".m3u8");

/**
 * https://res.cloudinary.com/<cloud>/video/upload/v123/posts/user/abc.mp4
 *  -> "posts/user/abc"
 */
const extractPublicId = (url) => {
  const clean = url.split("?")[0];
  const marker = "/video/upload/";
  const idx = clean.indexOf(marker);
  if (idx === -1) return null;

  let rest = clean.slice(idx + marker.length);
  rest = rest.replace(/^v\d+\//, ""); // version অংশ বাদ
  rest = rest.replace(/\.[a-z0-9]+$/i, ""); // extension বাদ

  // বাংলা folder নাম: %E0%A6... থেকে আসল অক্ষরে ফেরানো
  try {
    rest = decodeURIComponent(rest);
  } catch {
    // decode না হলে যেমন আছে তেমন থাকুক
  }
  return rest || null;
};

const buildHlsUrl = (publicId) =>
  cloudinary.url(publicId, {
    resource_type: "video",
    streaming_profile: HLS_PROFILE,
    format: "m3u8",
    secure: true,
  });

// ───────────── rollback ─────────────
const runRollback = async (file) => {
  const backup = JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(`Rollback: ${backup.length} টা post ফেরানো হচ্ছে...`);

  for (const item of backup) {
    await Post.updateOne(
      { _id: item.postId },
      { $set: { "content.media.0": item.oldUrl } },
    );
  }
  console.log("Rollback শেষ।");
};

// ───────────── migration ─────────────
const runMigration = async () => {
  const query = {
    postType: "post",
    "content.type": "video",
    "content.media.0": { $exists: true },
  };

  let cursor = Post.find(query).select("_id content.media").lean().cursor();

  const backup = [];
  const stats = { checked: 0, skipped: 0, migrated: 0, failed: 0 };

  console.log(APPLY ? "মোড: APPLY (database বদলাবে)" : "মোড: DRY-RUN");

  for await (const post of cursor) {
    if (LIMIT && stats.migrated >= LIMIT) break;
    stats.checked++;

    const oldUrl = post.content?.media?.[0];

    if (!oldUrl || isHls(oldUrl)) {
      stats.skipped++;
      continue;
    }

    const publicId = extractPublicId(oldUrl);
    if (!publicId) {
      console.log(`SKIP (public_id পাওয়া যায়নি): ${post._id} ${oldUrl}`);
      stats.skipped++;
      continue;
    }

    const newUrl = buildHlsUrl(publicId);

    if (!APPLY) {
      console.log(
        `[dry-run] ${post._id}\n  পুরনো: ${oldUrl}\n  নতুন : ${newUrl}`,
      );
      stats.migrated++;
      continue;
    }

    try {
      // Cloudinary-কে HLS version আগে থেকে বানিয়ে রাখতে বলা (পিছনে চলে)
      await cloudinary.uploader.explicit(publicId, {
        type: "upload",
        resource_type: "video",
        eager: [{ streaming_profile: HLS_PROFILE, format: "m3u8" }],
        eager_async: true,
      });

      await Post.updateOne(
        { _id: post._id },
        { $set: { "content.media.0": newUrl } },
      );

      backup.push({ postId: String(post._id), oldUrl, newUrl });
      stats.migrated++;
      console.log(`OK ${post._id}`);
    } catch (err) {
      stats.failed++;
      console.log(`FAIL ${post._id}: ${err?.message || err}`);
    }

    await sleep(DELAY_MS);
  }

  if (APPLY && backup.length > 0) {
    const file = `hls-migration-backup-${Date.now()}.json`;
    fs.writeFileSync(file, JSON.stringify(backup, null, 2));
    console.log(`\nBackup ফাইল: ${file}`);
  }

  console.log("\n── ফলাফল ──");
  console.log(`দেখা হয়েছে : ${stats.checked}`);
  console.log(`বাদ গেছে    : ${stats.skipped}`);
  console.log(`${APPLY ? "বদলানো হয়েছে" : "বদলাত      "}: ${stats.migrated}`);
  console.log(`ব্যর্থ      : ${stats.failed}`);
};

// ───────────── main ─────────────
const main = async () => {
  if (!MONGO_URI) {
    console.log("MONGO_URI পাওয়া যায়নি, .env দেখুন");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("Database connected");

  if (ROLLBACK_FILE) await runRollback(ROLLBACK_FILE);
  else await runMigration();

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
