import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // answer (public + private) নাকি chapter এর rating
    targetType: {
      type: String,
      enum: ["answer", "chapter"],
      default: "answer",
      required: true,
    },

    // ── answer rating এর জন্য ──
    answerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    },
    // public question হলে Post, private হলে PrivateQuestion — তাই ref নেই
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    answerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ── chapter rating এর জন্য ──
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
    },
    handoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Handout",
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

// targetType অনুযায়ী দরকারি field আছে কিনা
ratingSchema.pre("validate", function (next) {
  if (this.targetType === "answer") {
    if (!this.answerId || !this.questionId || !this.answerUserId) {
      return next(
        new Error("answerId, questionId ও answerUserId আবশ্যক (answer rating)"),
      );
    }
  } else if (this.targetType === "chapter") {
    if (!this.chapterId || !this.handoutId) {
      return next(new Error("chapterId ও handoutId আবশ্যক (chapter rating)"));
    }
  }
  next();
});

// একজন user একটা answer এ একবারই rate করতে পারবে
// $type ব্যবহার করা হয়েছে যাতে null/missing answerId (chapter rating) index এ না ঢোকে
ratingSchema.index(
  { userId: 1, answerId: 1 },
  {
    unique: true,
    name: "userId_answerId_unique",
    partialFilterExpression: { answerId: { $type: "objectId" } },
  },
);

// একজন user একটা chapter এ একবারই rate করতে পারবে
ratingSchema.index(
  { userId: 1, chapterId: 1 },
  {
    unique: true,
    name: "userId_chapterId_unique",
    partialFilterExpression: { chapterId: { $type: "objectId" } },
  },
);

ratingSchema.index({ answerId: 1 });
ratingSchema.index({ answerUserId: 1 });
ratingSchema.index({ questionId: 1 });
ratingSchema.index({ chapterId: 1 });
ratingSchema.index({ handoutId: 1 });

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
