import express from "express";
import {
  getMediaPosts,
  getMediaPostsByUser,
} from "../../controllers/post/getMediaPosts.js";

const router = express.Router();

// 🟢 All image + video posts
router.get("/media", getMediaPosts);

// 🟢 Image + video posts by user
router.get("/media/:userid", getMediaPostsByUser);

export default router;
