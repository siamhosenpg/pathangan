import express from "express";
import imageUpload from "../middleware/profileupload.js";
import {
  getUsers,
  getUserByUsername,
  updateUser,
  deleteUser,
  getSuggestedUsers,
  savePushToken,
  removePushToken,
  acceptTerms,
} from "../controllers/usercontrol.js";

import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/user", optionalAuth, getUsers);
router.get("/user/:username", optionalAuth, getUserByUsername);
router.put(
  "/user/:userid",
  protect,
  imageUpload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateUser,
); // ✅ ইউজার তথ্য আপডেট করবে
router.delete("/user/:userid", protect, deleteUser); // ✅ ইউজার ডিলিট করবে
router.get("/suggested", protect, getSuggestedUsers); // ✅ ইউজার ডিলিট করবে

router.post("/push-token", protect, savePushToken);
router.delete("/push-token", protect, removePushToken);
router.post("/accept-terms", protect, acceptTerms);

export default router;
