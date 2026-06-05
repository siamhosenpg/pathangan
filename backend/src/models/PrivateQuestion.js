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
  },
  { timestamps: true },
);

privateQuestionSchema.index({ receiverId: 1, createdAt: -1 });
privateQuestionSchema.index({ senderId: 1, createdAt: -1 });
privateQuestionSchema.index({ receiverId: 1, status: 1, createdAt: -1 });
privateQuestionSchema.index({ receiverId: 1, isRead: 1 });
privateQuestionSchema.index({ questionText: "text" });

const PrivateQuestion = mongoose.model(
  "PrivateQuestion",
  privateQuestionSchema,
);
export default PrivateQuestion;
