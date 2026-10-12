import mongoose from "mongoose";
import Block from "../models/blockModel.js";
import User from "../models/usermodel.js";
import Follow from "../models/followModel.js";

// ===================== BLOCK USER =====================
export const blockUser = async (req, res) => {
  try {
    const myId = req.user?.id;
    const { userId } = req.params;

    if (!myId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (myId.toString() === userId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const target = await User.findOne({
      _id: userId,
      accountStatus: { $nin: ["deleted"] },
    }).select("_id");

    if (!target) return res.status(404).json({ message: "User not found" });

    // আগে block record তৈরি (আগে থেকে থাকলে duplicate error ignore)
    try {
      await Block.create({ blocker: myId, blocked: userId });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }

    // দুই দিকের follow সম্পর্ক মুছে counter ঠিক করা
    const follows = await Follow.find({
      $or: [
        { followerId: myId, followingId: userId },
        { followerId: userId, followingId: myId },
      ],
    })
      .select("followerId followingId")
      .lean();

    if (follows.length > 0) {
      await Follow.deleteMany({ _id: { $in: follows.map((f) => f._id) } });

      await User.bulkWrite(
        follows.flatMap((f) => [
          {
            updateOne: {
              filter: { _id: f.followingId },
              update: { $inc: { "activityStats.totalFollowers": -1 } },
            },
          },
          {
            updateOne: {
              filter: { _id: f.followerId },
              update: { $inc: { "activityStats.totalFollowing": -1 } },
            },
          },
        ]),
      );
    }

    return res.status(200).json({ success: true, message: "User blocked" });
  } catch (err) {
    console.error("blockUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== UNBLOCK USER =====================
export const unblockUser = async (req, res) => {
  try {
    const myId = req.user?.id;
    const { userId } = req.params;

    if (!myId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    await Block.deleteOne({ blocker: myId, blocked: userId });

    return res.status(200).json({ success: true, message: "User unblocked" });
  } catch (err) {
    console.error("unblockUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== MY BLOCKED LIST (cursor) =====================
export const getBlockedUsers = async (req, res) => {
  try {
    const myId = req.user?.id;
    if (!myId) return res.status(401).json({ message: "Login required" });

    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor = req.query.cursor;

    if (cursor && !mongoose.Types.ObjectId.isValid(cursor)) {
      return res.status(400).json({ message: "Invalid cursor" });
    }

    const query = { blocker: myId };
    if (cursor) query._id = { $lt: new mongoose.Types.ObjectId(cursor) };

    const blocks = await Block.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("blocked", "name username profileImage greenmarkVerified")
      .lean();

    const hasMore = blocks.length > limit;
    if (hasMore) blocks.pop();

    const users = blocks
      .filter((b) => b.blocked) // user delete হয়ে গেলে populate null
      .map((b) => ({
        blockId: b._id,
        user: b.blocked,
        blockedAt: b.createdAt,
      }));

    return res.status(200).json({
      success: true,
      users,
      hasMore,
      nextCursor: hasMore ? blocks[blocks.length - 1]._id : null,
    });
  } catch (err) {
    console.error("getBlockedUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== BLOCK STATUS (শুধু আমি block করেছি কিনা) =====================
export const getBlockStatus = async (req, res) => {
  try {
    const myId = req.user?.id;
    const { userId } = req.params;

    if (!myId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const exists = await Block.exists({ blocker: myId, blocked: userId });

    // কেউ আমাকে block করেছে কিনা সেটা কখনো জানানো হয় না
    return res.status(200).json({ success: true, isBlockedByMe: !!exists });
  } catch (err) {
    console.error("getBlockStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
