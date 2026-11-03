import mongoose from "mongoose";
import { FEED_CONFIG } from "../../helpers/feed/feedConfig.js";

// একবারে বানানো ফিডের ক্রম। পরের page এই তালিকা থেকেই আসে
const feedSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    postIds: [{ type: mongoose.Schema.Types.ObjectId }],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: FEED_CONFIG.session.ttlMinutes * 60,
    },
  },
  { versionKey: false },
);

export default mongoose.model("FeedSession", feedSessionSchema);
