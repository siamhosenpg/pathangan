import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// একই জুটি দুইবার block হবে না
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
// "আমাকে কে block করেছে" খুঁজতে
blockSchema.index({ blocked: 1 });

const Block = mongoose.models.Block || mongoose.model("Block", blockSchema);
export default Block;
