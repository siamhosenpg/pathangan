import mongoose from "mongoose";
const savedItemSchema = new mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavedCollection",
      required: true,
    },
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
  { timestamps: true }
);

// prevent same post duplicated inside same collection
savedItemSchema.index({ collectionId: 1, postId: 1 }, { unique: true });

export default mongoose.model("SavedItem", savedItemSchema);
