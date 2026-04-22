import mongoose from "mongoose";
const savedCollectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },

    default: { type: Boolean, default: false }, // <-- added
  },

  { timestamps: true }
);

savedCollectionSchema.index({ userId: 1, name: 1 }, { unique: true });
// একই নামের folder আরেকটা হবে না

export default mongoose.model("SavedCollection", savedCollectionSchema);
