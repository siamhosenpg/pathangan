import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true },
);

// একজন user একটা answer এ একবারই rate করতে পারবে
ratingSchema.index({ userId: 1, answerId: 1 }, { unique: true });

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
