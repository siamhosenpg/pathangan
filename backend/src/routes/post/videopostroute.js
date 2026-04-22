import express from "express";
import {
  getVideoPosts,
  getVideoPostsByUser,
} from "../../controllers/post/videopostController.js";

const router = express.Router();

// 🔥 All video posts
router.get("/videos", getVideoPosts);

// 🔥 Video posts by user
router.get("/videos/user/:userid", getVideoPostsByUser);

export default router;
