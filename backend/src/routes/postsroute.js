import express from "express";
import upload from "../middleware/upload.js";
import {
  getPosts,
  createPost,
  createQuestionPost,
  createCoursePost,
  updatePost,
  deletePost,
  getPostsByUserId,
  getPostById,
  createSharePost,
  getPostCountByUserId,
} from "../controllers/postcontrol.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ✅ Static routes আগে
router.get("/", getPosts);
router.get("/user/:userid/count", getPostCountByUserId); // ← count আগে
router.get("/user/:userid", getPostsByUserId); // ← তারপর userid
router.get("/post/:id", getPostById); // ← static আগে

// ✅ Create routes
router.post("/", protect, upload.array("media", 10), createPost);
router.post("/create/question", protect, createQuestionPost);
router.post(
  "/create/course",
  protect,
  upload.array("media", 10),
  createCoursePost,
);
router.post("/share", protect, createSharePost);

// ✅ Dynamic :id routes সবার শেষে
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

export default router;
