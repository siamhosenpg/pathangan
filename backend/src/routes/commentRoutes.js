import express from "express";
import {
  getCommentsCount,
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  getRepliesByComment,
} from "../controllers/commentController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// ===============================
router.get("/count/:postId", getCommentsCount);

// Create comment
router.post("/", protect, createComment);

// Get comments of a post (with pagination)
router.get("/:postId", getCommentsByPost);

// Update comment
router.put("/:commentId", protect, updateComment);

// Delete comment
router.delete("/:commentId", protect, deleteComment);
// Get replies of a specific comment
router.get("/replies/:commentId", getRepliesByComment);

export default router;
