import express from "express";
import upload from "../middleware/upload.js";
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  getPostsByUserId,
  getPostByMongoId,
  createSharePost,
  getPostCountByUserId,
} from "../controllers/postcontrol.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ✅ Specific routes first
router.get("/", getPosts); // সব পোস্ট দেখাবে
router.get("/user/:userid", getPostsByUserId); // নির্দিষ্ট ইউজারের সব পোস্ট
router.get("/user/:userid/count", getPostCountByUserId);
router.post("/", protect, upload.array("media", 10), createPost); // নতুন পোস্ট তৈরি
router.put("/:id", protect, updatePost); // পোস্ট এডিট
router.delete("/:id", protect, deletePost); // পোস্ট ডিলিট
router.get("/post/:id", getPostByMongoId);

router.post("/share", protect, createSharePost);

export default router;
