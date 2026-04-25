import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Question ID is required"],
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    text: {
      type: String,
      required: [true, "Answer text is required"],
      trim: true,
      minlength: [5, "Answer must be at least 5 characters"],
      maxlength: [10000, "Answer cannot exceed 10000 characters"],
    },

    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    upvotesCount: { type: Number, default: 0 },
    downvotesCount: { type: Number, default: 0 },

    isBestAnswer: { type: Boolean, default: false },

    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// একই user একই question এ একবারই answer দিতে পারবে
answerSchema.index({ questionId: 1, userId: 1 }, { unique: true });

answerSchema.index({ text: "text" });

const Answer = mongoose.model("Answer", answerSchema);
export default Answer;
