import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true, // 🔥 Searching comments by post → MUCH faster
    },

    commentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // 🔥 Filter by user → faster user profile load
    },

    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },

    text: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    media: {
      url: {
        type: [String], // string array
        default: [],
      },
      type: {
        type: String,
        enum: ["image", "video", "gif", null],
        default: null,
      },
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // 🔥 Comment sorting faster (newest first)
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// 🔥 Compound Index (Most Important)
// Find comments of a post + sorted by date = Ultra Fast
commentSchema.index({ postId: 1, createdAt: -1 });

// 🔥 Index for searching text (optional)
commentSchema.index({ text: "text" });

export default mongoose.model("Comment", commentSchema);
