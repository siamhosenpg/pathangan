import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    postid: {
      type: Number,
    },
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      default: null,
      index: true,
    },
    postType: { type: String, default: "post" },
    content: {
      parentPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
      caption: { type: String, trim: true },
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

    privacy: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

postSchema.index({
  "content.caption": "text",
});
// ✅ MUST export model
const Post = mongoose.model("Post", postSchema);
export default Post;
