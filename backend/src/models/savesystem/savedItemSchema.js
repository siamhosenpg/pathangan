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
  { timestamps: true },
);

// একই পোস্ট একই কালেকশনে দুইবার সেভ হবে না
savedItemSchema.index({ collectionId: 1, postId: 1 }, { unique: true });

// কালেকশনের আইটেম নতুন থেকে পুরনো ক্রমে পেজ করার জন্য (infinite scroll)
savedItemSchema.index({ collectionId: 1, userId: 1, _id: -1 });

// একটা পোস্ট কোন কোন কালেকশনে সেভ আছে তা দ্রুত বের করার জন্য
savedItemSchema.index({ userId: 1, postId: 1 });

export default mongoose.model("SavedItem", savedItemSchema);
