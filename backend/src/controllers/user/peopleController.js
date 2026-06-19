import User from "../../models/usermodel.js";
import mongoose from "mongoose";

/**
 * 🟦 Suggestion Accounts (Infinite Scroll)
 * → Those users whom logged-in user does NOT follow
 * → Exclude logged-in user himself
 * → Each user has `isFollowing` field (N+1 fix — single aggregation query)
 * → Cursor-based pagination (10 per request)
 *
 * Query params:
 *   ?cursor=<lastUserId>   (optional, প্রথম রিকোয়েস্টে পাঠানোর দরকার নেই)
 *   ?limit=10              (optional, default 10)
 */
export const getPeople = async (req, res) => {
  try {
    const loggedUserId = req.user.id; // string

    if (!loggedUserId) {
      return res.status(401).json({ message: "Login required" });
    }

    const loggedUserObjectId = new mongoose.Types.ObjectId(loggedUserId);

    // limit সর্বোচ্চ ৫০ এ বেঁধে রাখা হলো, যাতে কেউ ইচ্ছাকৃতভাবে বড় limit পাঠাতে না পারে
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const cursor = req.query.cursor;

    // Match stage: নিজেকে বাদ দেওয়া + cursor এর পরের ইউজারগুলো আনা
    const matchStage = {
      _id: { $ne: loggedUserObjectId },
    };

    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        return res.status(400).json({ message: "Invalid cursor" });
      }
      // _id বড় (পরবর্তী) এমন ইউজারগুলো আনবে — ObjectId creation-time অনুযায়ী sequential
      matchStage._id.$gt = new mongoose.Types.ObjectId(cursor);
    }

    const suggestions = await User.aggregate([
      // 1️⃣ নিজেকে বাদ + cursor এর পরের ইউজার
      { $match: matchStage },

      // 2️⃣ _id অনুযায়ী sort (cursor pagination এর জন্য consistent order জরুরি)
      { $sort: { _id: 1 } },

      // 3️⃣ Lookup: এই ইউজারকে আমি ফলো করি কিনা (single query, no loop)
      {
        $lookup: {
          from: "follows", // Follow মডেলের collection name
          let: { targetUserId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$followerId", loggedUserObjectId] },
                    { $eq: ["$followingId", "$$targetUserId"] },
                  ],
                },
              },
            },
          ],
          as: "followInfo",
        },
      },

      // 4️⃣ isFollowing boolean ফিল্ড যোগ করা
      {
        $addFields: {
          isFollowing: { $gt: [{ $size: "$followInfo" }, 0] },
        },
      },

      // 5️⃣ যাদের আগে থেকেই ফলো করি, তাদের বাদ (suggestion list এ দেখানোর দরকার নেই)
      { $match: { isFollowing: false } },

      // 6️⃣ পাসওয়ার্ড ও অতিরিক্ত ফিল্ড বাদ
      { $project: { password: 0, followInfo: 0 } },

      // 7️⃣ এক ব্যাচে limit + 1 আনা হচ্ছে, যাতে বোঝা যায় আরও ডেটা আছে কিনা
      { $limit: limit + 1 },
    ]);

    // hasMore চেক করার জন্য extra ১টা বাদ দেওয়া
    const hasMore = suggestions.length > limit;
    const users = hasMore ? suggestions.slice(0, limit) : suggestions;
    const nextCursor = users.length > 0 ? users[users.length - 1]._id : null;

    res.status(200).json({
      count: users.length,
      users,
      nextCursor: hasMore ? nextCursor : null,
      hasMore,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error while loading suggestions",
      error: err.message,
    });
  }
};
