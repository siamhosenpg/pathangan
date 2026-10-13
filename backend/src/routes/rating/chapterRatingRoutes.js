import express from "express";
import { protect, optionalAuth } from "../../middleware/auth.js";
import {
  giveChapterRating,
  getChapterRating,
  getHandoutRating,
  deleteChapterRating,
} from "../../controllers/rating/chapterRatingController.js";

const router = express.Router();

router.get("/handout/:handoutId", getHandoutRating);
router.get("/:chapterId", optionalAuth, getChapterRating);
router.put("/:chapterId", protect, giveChapterRating);
router.delete("/:chapterId", protect, deleteChapterRating);

export default router;
