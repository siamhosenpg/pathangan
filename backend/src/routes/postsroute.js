import express from "express";
import upload from "../middleware/upload.js";
import { optionalProtect } from "../middleware/optionalProtect.js"; // ← import করো
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
import { recordView } from "../controllers/post/viewController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ✅ Static routes আগে
router.get("/", optionalProtect, getPosts);
router.get("/user/:userid/count", optionalProtect, getPostCountByUserId); // ← count আগে
router.get("/user/:userid", optionalProtect, getPostsByUserId); // ← তারপর userid
router.get("/post/:id", optionalProtect, getPostById); // ← static আগে

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

// routes এর মধ্যে — optionalProtect দিয়ে (guest ও view করতে পারবে)
router.post("/view/:postId", optionalProtect, recordView);

export default router;
