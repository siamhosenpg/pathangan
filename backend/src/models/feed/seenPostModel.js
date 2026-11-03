import mongoose from "mongoose";

// কোন user কোন post দেখেছে বা কোন ঘটনা (like, view...) একবার গোনা হয়েছে।
// expireAt পার হলে MongoDB নিজে মুছে দেয় (TTL)
const seenPostSchema = new mongoose.Schema(
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
    // কোন কোন ঘটনা আগ্রহে গোনা হয়ে গেছে (একই ঘটনা দুবার গোনা হবে না)
    counted: { type: [String], default: [] },
    // "আগ্রহী নই" করা post (অনেক দিন আর আসবে না)
    dismissed: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: Date.now },
    expireAt: { type: Date, required: true },
  },
  { versionKey: false },
);

seenPostSchema.index({ userId: 1, postId: 1 }, { unique: true });
seenPostSchema.index({ userId: 1, lastSeenAt: -1 });
seenPostSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("SeenPost", seenPostSchema);
