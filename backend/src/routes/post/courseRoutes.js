import express from "express";
import upload from "../../middleware/upload.js";
import { protect } from "../../middleware/auth.js";
import { optionalProtect } from "../../middleware/optionalProtect.js";
import {
  getAllCourses,
  getCoursesByUserId,
  getCourseById,
} from "../../controllers/post/courseController.js";
import {
  createCoursePost,
  updatePost,
  deletePost,
} from "../../controllers/postcontrol.js";

const router = express.Router();

// ✅ Static routes আগে
router.get("/", optionalProtect, getAllCourses);
router.get("/user/:userid", optionalProtect, getCoursesByUserId);
router.get("/:id", optionalProtect, getCourseById);

// ✅ Create / Update / Delete
router.post("/", protect, upload.array("media", 10), createCoursePost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

export default router;
