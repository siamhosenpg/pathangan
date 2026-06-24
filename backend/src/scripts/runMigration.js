import Post from "../models/postmodel.js";
import User from "../models/usermodel.js";

export const runMigration = async (req, res) => {
  try {
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
          warning: { count: 0, lastWarnedAt: null, lastReason: null },
          reportCount: 0,
          deletedAt: null,
          deletedBy: null,
        },
      },
    );

    return res.json({
      success: true,
      postsMigrated: postResult.modifiedCount,
      usersMigrated: userResult.modifiedCount,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
