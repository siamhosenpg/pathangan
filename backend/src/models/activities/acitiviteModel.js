import mongoose from "mongoose";

const acitivitySchema = new mongoose.Schema(
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
      followId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto
  }
);

// important indexes
acitivitySchema.index({ userId: 1, createdAt: -1 });

export const Activity = mongoose.model("Activity", acitivitySchema);
