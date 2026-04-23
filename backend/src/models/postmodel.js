import mongoose from "mongoose";

// ===================== QUESTION POST SCHEMA =====================
const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true, trim: true },
  tags: [{ type: String }],
});

// ===================== COURSE MEDIA SCHEMA =====================
const courseMediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    url: { type: String, required: true },
    thumbnail: { type: String }, // optional
    duration: { type: String }, // optional
  },
  { _id: false },
);

// ===================== COURSE POST SCHEMA =====================
const courseSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  media: [courseMediaSchema],
  price: { type: Number, default: 0 },
  tags: [{ type: String }],
});

// ===================== MAIN POST SCHEMA =====================
const postSchema = new mongoose.Schema(
  {
    // ❌ postid REMOVED (MongoDB _id will handle everything)

    userid: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    postType: {
      type: String,
      enum: ["post", "question", "course"],
      default: "post",
      required: true,
      index: true,
    },

    // ===================== NORMAL POST =====================
    content: {
      parentPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
      title: { type: String, trim: true },
      text: { type: String, trim: true },
      media: [{ type: String }],
      type: {
        type: String,
        enum: ["image", "video", "text", "share", "audio"],
        default: "text",
      },
      location: { type: String },
      tags: [{ type: String }],
      mentions: [{ type: String }],
    },

    // ===================== QUESTION POST =====================
    question: questionSchema,

    // ===================== COURSE POST =====================
    course: courseSchema,

    privacy: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },

    // optional counters (future use)
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// 🔥 FIXED TEXT INDEX (caption ছিল ভুল)
postSchema.index({
  "content.text": "text",
  "content.title": "text",
  "question.questionText": "text",
});

const Post = mongoose.model("Post", postSchema);
export default Post;
