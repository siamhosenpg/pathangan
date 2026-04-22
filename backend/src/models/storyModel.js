import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    media: {
      url: {
        type: String, // Single media per story item (image/video)
        required: true,
      },
      type: {
        type: String,
        enum: ["image", "video"],
        required: true,
      },
    },

    expiresAt: {
      type: Date, // Story auto-expiry time (e.g., 24h later)
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt & updatedAt
    versionKey: false,
  }
);

// Optional: Index for fast querying user stories
storySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Story", storySchema);
