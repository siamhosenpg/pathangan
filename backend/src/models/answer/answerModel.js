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

    reportCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },

    // ── নতুন ──
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ===================== MODERATION =====================
    // পুরোনো answer-এ এই field নেই, query-তে সেগুলো active ধরা হয়
    moderationStatus: {
      type: String,
      enum: ["active", "hidden", "auto_hidden", "removed"],
      default: "active",
      index: true,
    },
    moderationHistory: [
      {
        status: { type: String },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String, trim: true, default: null },
        note: { type: String, trim: true, default: null },
      },
    ],
  },
  { timestamps: true },
);

// একই user একই question এ একবারই (active) answer দিতে পারবে
// deleted answer এই unique rule এর বাইরে
answerSchema.index(
  { questionId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);
answerSchema.index({ text: "text" });

const Answer = mongoose.model("Answer", answerSchema);
export default Answer;
