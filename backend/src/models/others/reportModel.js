import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetType: {
      type: String,
      enum: ["post", "user", "answer", "comment"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hate_speech",
        "misinformation",
        "inappropriate_content",
        "violence",
        "copyright",
        "self_harm",
        "impersonation",
        "other",
      ],
      required: true,
    },
    description: { type: String, trim: true, maxlength: 500 },

    // Report এর নিজের lifecycle
    status: {
      type: String,
      enum: [
        "pending", // নতুন report, এখনো দেখা হয়নি
        "in_review", // admin দেখছে
        "resolved", // action নেওয়া হয়েছে
        "dismissed", // valid না, বাতিল করা হয়েছে
      ],
      default: "pending",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },

    // Admin action
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    adminNote: { type: String, trim: true, default: null },

    // Report এর ফলে কী action নেওয়া হয়েছে
    actionTaken: {
      type: String,
      enum: [
        "none",
        "content_hidden",
        "content_removed",
        "content_restored",
        "user_warned",
        "user_suspended",
        "user_banned",
        "no_action",
      ],
      default: "none",
    },
  },
  { timestamps: true },
);

// একই user একই content কে একবারের বেশি report করতে পারবে না
reportSchema.index(
  { reportedBy: 1, targetId: 1, targetType: 1 },
  { unique: true },
);
reportSchema.index({ status: 1, priority: -1, createdAt: -1 });
reportSchema.index({ targetId: 1, targetType: 1 });

const Report = mongoose.model("Report", reportSchema);
export default Report;
