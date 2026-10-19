import mongoose from "mongoose";

const privateQuestionSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["pending", "answered", "ignored"],
      default: "pending",
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ── edit ──
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    // ── report ──
    reportCount: { type: Number, default: 0 },

    // ── soft delete ──
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

privateQuestionSchema.index({ receiverId: 1, isDeleted: 1, createdAt: -1 });
privateQuestionSchema.index({ senderId: 1, isDeleted: 1, createdAt: -1 });
privateQuestionSchema.index({
  senderId: 1,
  receiverId: 1,
  isDeleted: 1,
  createdAt: -1,
});
privateQuestionSchema.index({
  receiverId: 1,
  status: 1,
  isDeleted: 1,
  createdAt: -1,
});
privateQuestionSchema.index({ receiverId: 1, isRead: 1, isDeleted: 1 });
privateQuestionSchema.index({ questionText: "text" });

const PrivateQuestion = mongoose.model(
  "PrivateQuestion",
  privateQuestionSchema,
);
export default PrivateQuestion;
