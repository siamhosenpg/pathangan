// routes/followRoutes.js
import express from "express";
import { protect } from "../middleware/auth.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowersCount,
  getFollowingCount,
  checkIsFollowing,
} from "../controllers/followControl.js";

const router = express.Router();

// 🔹 Follow / Unfollow
router.post("/follow/:userId", protect, followUser);
router.delete("/unfollow/:userId", protect, unfollowUser);

// 🔹 Get followers / following
router.get("/followers/:userId", getFollowers); // public
router.get("/following/:userId", getFollowing); // public
// 🔹 Get followers / following count
router.get("/followers/count/:userId", getFollowersCount); // public
router.get("/following/count/:userId", getFollowingCount); // public

router.get("/is-following/:userId", protect, checkIsFollowing);

export default router;
