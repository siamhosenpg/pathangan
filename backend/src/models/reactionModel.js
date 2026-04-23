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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ✅ Prevent duplicate likes + fast lookup
reactionSchema.index({ userId: 1, postId: 1 }, { unique: true });

// ✅ Fast like count per post
reactionSchema.index({ postId: 1 });

export default mongoose.model("Reaction", reactionSchema);
