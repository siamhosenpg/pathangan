import express from "express";
import imageUpload from "../middleware/profileupload.js";
import {
  getUsers,
  getUserByUsername,
  updateUser,
  deleteUser,
  getSuggestedUsers,
} from "../controllers/usercontrol.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/user", getUsers); // ✅ সব ইউজার দেখাবে
router.get("/user/:username", getUserByUsername); // ✅ নির্দিষ্ট ইউজার দেখাবে (id দিয়ে)
router.put(
  "/user/:userid",
  protect,
  imageUpload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateUser
); // ✅ ইউজার তথ্য আপডেট করবে
router.delete("/user/:userid", protect, deleteUser); // ✅ ইউজার ডিলিট করবে
router.get("/suggested", protect, getSuggestedUsers); // ✅ ইউজার ডিলিট করবে

export default router;
