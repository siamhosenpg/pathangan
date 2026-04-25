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

// count
router.get("/count/:postId", getCommentsCount);

// replies — /:postId এর আগে থাকতে হবে
router.get("/replies/:commentId", getRepliesByComment);

// get comments of a post
router.get("/:postId", getCommentsByPost);

// create
router.post("/", protect, createComment);

// update
router.put("/:commentId", protect, updateComment);

// delete
router.delete("/:commentId", protect, deleteComment);

export default router;
