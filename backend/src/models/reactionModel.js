import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    reaction: {
      type: String,
      enum: ["like", "love", "haha", "wow", "sad", "angry", "care"],
      required: true,
    },
    // 🔥 Link to Activity
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

// ✅ Prevent duplicate reactions
reactionSchema.index({ userId: 1, postId: 1 }, { unique: true });

// ✅ Fast reaction count & analytics
reactionSchema.index({ postId: 1, reaction: 1 });

export default mongoose.model("Reaction", reactionSchema);
