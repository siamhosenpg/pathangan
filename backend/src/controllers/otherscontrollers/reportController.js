import mongoose from "mongoose";
import Report from "../../models/others/reportModel.js";
import Post from "../../models/postmodel.js";
import User from "../../models/userModel.js";

const AUTO_HIDE_THRESHOLD = 10;
const AUTO_REVIEW_THRESHOLD = 5; // ৫টা report এ under_review তে যাবে

// ===================== HELPER: moderation history তে নতুন entry যোগ =====================
const pushModerationHistory = (status, changedBy, reason, note = null) => ({
  $push: {
    moderationHistory: {
      status,
      changedBy,
      changedAt: new Date(),
      reason: reason ?? null,
      note: note ?? null,
    },
  },
});

// ===================== CREATE REPORT =====================
export const createReport = async (req, res) => {
  try {
    const reportedBy = req.user?.id;
    if (!reportedBy) return res.status(401).json({ message: "Login required" });

    const { targetType, targetId, reason, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Invalid target id" });
    }

    if (targetType === "user" && targetId === reportedBy.toString()) {
      return res.status(400).json({ message: "You cannot report yourself" });
    }

    // report priority নির্ধারণ
    const highPriorityReasons = ["violence", "self_harm", "hate_speech"];
    const priority = highPriorityReasons.includes(reason) ? "high" : "low";

    const report = await Report.create({
      reportedBy,
      targetType,
      targetId,
      reason,
      description,
      priority,
    });

    // post এর reportCount বাড়ানো এবং threshold check
    if (targetType === "post") {
      const post = await Post.findByIdAndUpdate(
        targetId,
        { $inc: { reportCount: 1 } },
        { new: true },
      );

      if (post) {
        // ৫টা report → under_review
        if (
          post.reportCount >= AUTO_REVIEW_THRESHOLD &&
          post.moderationStatus === "active"
        ) {
          await Post.findByIdAndUpdate(targetId, {
            moderationStatus: "under_review",
            ...pushModerationHistory(
              "under_review",
              null,
              "auto: report threshold reached",
            ),
          });
        }

        // ১০টা report → auto_hidden
        if (
          post.reportCount >= AUTO_HIDE_THRESHOLD &&
          post.moderationStatus !== "auto_hidden" &&
          post.moderationStatus !== "removed" &&
          post.moderationStatus !== "deleted"
        ) {
          await Post.findByIdAndUpdate(targetId, {
            moderationStatus: "auto_hidden",
            autoHiddenAt: new Date(),
            ...pushModerationHistory(
              "auto_hidden",
              null,
              "auto: high report count",
            ),
          });
        }
      }
    }

    if (targetType === "user") {
      await User.findByIdAndUpdate(targetId, {
        $inc: { reportCount: 1 },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "You have already reported this" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== SOFT DELETE POST (owner বা admin) =====================
export const deletePost = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Login required" });

    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findOne({
      _id: postId,
      moderationStatus: { $nin: ["deleted"] },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    const isOwner = post.userid.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const reason = isAdmin && !isOwner ? "admin_removed" : "user_request";

    await Post.findByIdAndUpdate(postId, {
      moderationStatus: "deleted",
      deletedAt: new Date(),
      deletedBy: userId,
      ...pushModerationHistory("deleted", userId, reason),
    });

    return res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== ADMIN: POST STATUS CHANGE =====================
export const changePostStatus = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const adminId = req.user.id;
    const { postId } = req.params;
    const { status, reason, note } = req.body;

    const allowedStatuses = [
      "active",
      "hidden",
      "under_review",
      "removed",
      "restored",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const updateData = {
      moderationStatus: status,
      ...pushModerationHistory(status, adminId, reason, note),
    };

    if (status === "removed") {
      updateData.removedAt = new Date();
      updateData.removedBy = adminId;
      updateData.removalReason = reason ?? null;
    }

    const post = await Post.findByIdAndUpdate(postId, updateData, {
      new: true,
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.status(200).json({
      success: true,
      message: `Post status changed to ${status}`,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== ADMIN: USER STATUS CHANGE =====================
export const changeUserStatus = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const adminId = req.user.id;
    const { userId } = req.params;
    const { status, reason, note, suspensionDays } = req.body;

    const allowedStatuses = [
      "active",
      "warned",
      "suspended",
      "banned",
      "under_review",
      "restored",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const expiresAt =
      status === "suspended" && suspensionDays
        ? new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000)
        : null;

    const updateData = {
      accountStatus: status,
      ...pushModerationHistory(status, adminId, reason, note),
    };

    if (status === "suspended") {
      updateData.suspension = {
        reason: reason ?? null,
        suspendedBy: adminId,
        suspendedAt: new Date(),
        expiresAt,
      };
    }

    if (status === "warned") {
      await User.findByIdAndUpdate(userId, {
        $inc: { "warning.count": 1 },
        $set: {
          accountStatus: "warned",
          "warning.lastWarnedAt": new Date(),
          "warning.lastReason": reason ?? null,
          $push: {
            moderationHistory: {
              status: "warned",
              changedBy: adminId,
              changedAt: new Date(),
              reason: reason ?? null,
              note: note ?? null,
            },
          },
        },
      });

      return res.status(200).json({ success: true, message: "User warned" });
    }

    if (status === "active" || status === "restored") {
      updateData.suspension = {
        reason: null,
        suspendedBy: null,
        suspendedAt: null,
        expiresAt: null,
      };
    }

    await User.findByIdAndUpdate(userId, updateData);

    return res.status(200).json({
      success: true,
      message: `User status changed to ${status}`,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== OWNER: ACCOUNT DEACTIVATE/DELETE =====================
export const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Login required" });

    const { permanent } = req.body; // true = delete, false = deactivate

    const newStatus = permanent ? "deleted" : "deactivated";

    await User.findByIdAndUpdate(userId, {
      accountStatus: newStatus,
      deletedAt: permanent ? new Date() : null,
      deletedBy: permanent ? userId : null,
      ...pushModerationHistory(newStatus, userId, "user_request"),
    });

    if (permanent) {
      // সব post soft delete
      await Post.updateMany(
        {
          userid: userId,
          moderationStatus: { $nin: ["deleted", "removed"] },
        },
        {
          moderationStatus: "deleted",
          deletedAt: new Date(),
          deletedBy: userId,
          $push: {
            moderationHistory: {
              status: "deleted",
              changedBy: userId,
              changedAt: new Date(),
              reason: "account_deleted",
            },
          },
        },
      );
    }

    return res.status(200).json({
      success: true,
      message: permanent
        ? "Account permanently deleted"
        : "Account deactivated",
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== ADMIN: GET REPORTS =====================
export const getReports = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { status = "pending", targetType, priority, page = 1 } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;
    if (priority) filter.priority = priority;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("reportedBy", "name username profileImage")
        .populate("reviewedBy", "name username")
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      reports,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== ADMIN: RESOLVE REPORT =====================
export const resolveReport = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { reportId } = req.params;
    const { status, adminNote, actionTaken } = req.body;

    if (!["resolved", "dismissed", "in_review"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        status,
        adminNote: adminNote ?? null,
        actionTaken: actionTaken ?? "none",
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      { new: true },
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Report marked as ${status}`,
      report,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
