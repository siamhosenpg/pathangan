import express from "express";
import {
  createReaction,
  updateReaction,
  deleteReaction,
  getReactionsByPost,
  getReactionCount,
  getTopReactionsByPost,
} from "../controllers/reactionController.js";

// ✅ Named import (default না)
import { protect } from "../middleware/auth.js";

const router = express.Router();

// 🟢 Create Reaction
router.post("/create", protect, createReaction);

// 🟡 Update Reaction
router.put("/update", protect, updateReaction);

// 🔴 Delete Reaction
router.delete("/:postId", protect, deleteReaction);

// 🟣 Get Reactions of a Post
router.get("/post/:postId", getReactionsByPost);

// 🟡 Get Reaction Count of a Post
router.get("/count/:postId", getReactionCount);
// 🔵 Get Top Reactions of a Post
router.get("/top/:postId", getTopReactionsByPost);

export default router;
