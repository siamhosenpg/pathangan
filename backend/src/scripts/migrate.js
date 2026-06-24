import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

import Post from "../models/postmodel.js";
import User from "../models/usermodel.js";

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Database connected");

    // ── POST migration ──────────────────────────────────────
    const postResult = await Post.updateMany(
      { moderationStatus: { $exists: false } },
      {
        $set: {
          moderationStatus: "active",
          moderationHistory: [],
          reportCount: 0,
          deletedAt: null,
          deletedBy: null,
          removedAt: null,
          removedBy: null,
        },
      },
    );
    console.log(`✅ Posts migrated: ${postResult.modifiedCount}`);

    // ── USER migration ──────────────────────────────────────
    const userResult = await User.updateMany(
      { accountStatus: { $exists: false } },
      {
        $set: {
          accountStatus: "active",
          moderationHistory: [],
          suspension: {
            reason: null,
            suspendedBy: null,
            suspendedAt: null,
            expiresAt: null,
          },
          warning: {
            count: 0,
            lastWarnedAt: null,
            lastReason: null,
          },
          reportCount: 0,
          deletedAt: null,
          deletedBy: null,
        },
      },
    );
    console.log(`✅ Users migrated: ${userResult.modifiedCount}`);

    console.log("🎉 Migration complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

migrate();
