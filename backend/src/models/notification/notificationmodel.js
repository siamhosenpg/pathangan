import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["follow", "react", "comment", "share"],
      required: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    target: {
      postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        default: null,
      },
      commentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null,
      },
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto
  }
);

// important indexes
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
