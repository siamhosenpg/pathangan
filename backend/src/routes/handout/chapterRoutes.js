import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  addChapter,
  updateChapter,
  deleteChapter,
  getChaptersByHandout,
  reorderChapters,
} from "../../controllers/handout/chapterController.js";

const router = express.Router();

router.post("/", protect, addChapter);
router.get("/handout/:handoutId", getChaptersByHandout);
router.put("/:id", protect, updateChapter);
router.delete("/:id", protect, deleteChapter);
router.put("/reorder/:handoutId", protect, reorderChapters);

export default router;
