import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    commentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // সবসময় মূল (root) comment এর id — reply এর reply হলেও root এরই থাকবে
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    // reply টা আসলে কার উদ্দেশ্যে (@mention দেখানোর জন্য)
    replyToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    text: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    media: {
      url: {
        type: [String],
        default: [],
      },
      type: {
        type: String,
        enum: ["image", "video", "gif", null],
        default: null,
      },
    },

    // report সংখ্যা
    reportCount: { type: Number, default: 0 },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1, createdAt: 1 });
commentSchema.index({ text: "text" });

export default mongoose.model("Comment", commentSchema);
