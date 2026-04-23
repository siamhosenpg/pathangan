import express from "express";
import {
  toggleReaction,
  getReactionsByPost,
  getReactionCount,
  checkUserLiked,
} from "../controllers/reactionController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// 🟢 Toggle Like (Like / Unlike)
router.post("/toggle", protect, toggleReaction);

// 🟣 Get Likes of a Post
router.get("/post/:postId", getReactionsByPost);

router.get("/check/:postId", protect, checkUserLiked);

// 🟡 Count Likes
router.get("/count/:postId", getReactionCount);

export default router;
