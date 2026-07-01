import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    handout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Handout",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    wordCount: {
      type: Number,
      default: 0,
    },

    // ── সফট ডিলিট ──
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

chapterSchema.index({ handout: 1, isDeleted: 1, order: 1 });

const Chapter = mongoose.model("Chapter", chapterSchema);
export default Chapter;
