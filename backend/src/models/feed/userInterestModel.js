import mongoose from "mongoose";

// প্রতিটা user-এর আগ্রহ।
// weights: { cricket: <নম্বর>, poetry: <নম্বর> }
// নম্বরগুলো "সময়ের সাথে বড় করা" অবস্থায় জমে (দেখুন feedConfig.decayScale),
// তাই ক্ষয়ের জন্য আলাদা job বা বারবার লেখা লাগে না। পড়ার সময় ভাগ করলেই আসল নম্বর
const userInterestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    weights: { type: mongoose.Schema.Types.Mixed, default: {} },
    // onboarding বা সেটিংসে user নিজে যা বেছেছে
    selected: [{ type: String }],
    eventsCount: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false, minimize: false },
);

export default mongoose.model("UserInterest", userInterestSchema);
