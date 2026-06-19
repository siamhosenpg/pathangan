import express from "express";
import upload from "../middleware/upload.js";
import { optionalProtect } from "../middleware/optionalProtect.js";
import {
  createPost,
  createQuestionPost,
  createCoursePost,
  updatePost,
  deletePost,
  getPostById,
  createSharePost,
  getPostCountByUserId,
} from "../controllers/postcontrol.js";
import { getPosts } from "../controllers/post/feedController.js"; // ← নতুন alada file theke import
import { getPostsByUserId } from "../controllers/post/userPostsController.js";
import { recordView } from "../controllers/post/viewController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ✅ Static routes আগে
router.get("/", optionalProtect, getPosts);
router.get("/user/:userid/count", optionalProtect, getPostCountByUserId);
router.get("/user/:userid", optionalProtect, getPostsByUserId);
router.get("/post/:id", optionalProtect, getPostById);

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

router.post("/view/:postId", optionalProtect, recordView);

export default router;
