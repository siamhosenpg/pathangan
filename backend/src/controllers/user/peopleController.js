import User from "../../models/usermodel.js";
import mongoose from "mongoose";

export const getPeople = async (req, res) => {
  try {
    const loggedUserId = req.user.id;

    if (!loggedUserId) {
      return res.status(401).json({ message: "Login required" });
    }

    const loggedUserObjectId = new mongoose.Types.ObjectId(loggedUserId);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const cursor = req.query.cursor;

    const matchStage = {
      _id: { $ne: loggedUserObjectId },
      // deleted, banned, deactivated, suspended account people list এ আসবে না
      accountStatus: {
        $nin: ["deleted", "banned", "deactivated", "suspended"],
      },
    };

    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        return res.status(400).json({ message: "Invalid cursor" });
      }
      matchStage._id.$gt = new mongoose.Types.ObjectId(cursor);
    }

    const suggestions = await User.aggregate([
      { $match: matchStage },
      { $sort: { _id: 1 } },
      {
        $lookup: {
          from: "follows",
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
      {
        $addFields: {
          isFollowing: { $gt: [{ $size: "$followInfo" }, 0] },
        },
      },
      // আগে থেকে follow করা account suggestion এ আসবে না
      { $match: { isFollowing: false } },
      { $project: { password: 0, followInfo: 0 } },
      { $limit: limit + 1 },
    ]);

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
