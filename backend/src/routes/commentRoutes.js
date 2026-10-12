import express from "express";
import {
  getCommentsCount,
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  getRepliesByComment,
} from "../controllers/commentController.js";
import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// count
router.get("/count/:postId", optionalAuth, getCommentsCount);

// replies — /:postId এর আগে থাকতে হবে
router.get("/replies/:commentId", optionalAuth, getRepliesByComment);

// get comments of a post
router.get("/:postId", optionalAuth, getCommentsByPost);

// create
router.post("/", protect, createComment);

// update
router.put("/:commentId", protect, updateComment);

// delete
router.delete("/:commentId", protect, deleteComment);

export default router;
