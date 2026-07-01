import mongoose from "mongoose";

const handoutSchema = new mongoose.Schema(
  {
    // ── লেখক ──
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── মূল তথ্য ──
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    coverImage: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: ["golpo", "itihash", "dharmiyo", "kobita", "ovizoggota", "onnanno"],
      required: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // ── স্ট্যাটাস ──
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },

    // ── ডিনরমালাইজড কাউন্টার (আপনার existing pattern অনুযায়ী) ──
    chaptersCount: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    estimatedReadTime: { type: Number, default: 0 }, // মিনিটে
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },

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
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// ── ইনডেক্স ──
handoutSchema.index({ user: 1, isDeleted: 1, status: 1 });
handoutSchema.index({ category: 1, isDeleted: 1, status: 1, publishedAt: -1 });
handoutSchema.index({ title: "text", description: "text", tags: "text" });

const Handout = mongoose.model("Handout", handoutSchema);
export default Handout;
