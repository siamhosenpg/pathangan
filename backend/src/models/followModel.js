// models/Follow.js
import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

followSchema.index({ followingId: 1, _id: -1 }); // getFollowers
followSchema.index({ followerId: 1, _id: -1 }); // getFollowing
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true }); // duplicate follow ঠেকাতে

export default mongoose.model("Follow", followSchema);
