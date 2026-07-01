import express from "express";
import { protect, optionalAuth } from "../../middleware/auth.js";
import {
  createHandout,
  updateHandout,
  publishHandout,
  getHandouts,
  getMyHandouts,
  getHandoutBySlug,
  softDeleteHandout,
  restoreHandout,
} from "../../controllers/handout/handoutController.js";

const router = express.Router();

router.post("/", protect, createHandout);
router.get("/", optionalAuth, getHandouts);
router.get("/mine", protect, getMyHandouts);
router.get("/:slug", optionalAuth, getHandoutBySlug);
router.put("/:id", protect, updateHandout);
router.post("/:id/publish", protect, publishHandout);
router.delete("/:id", protect, softDeleteHandout);
router.post("/:id/restore", protect, restoreHandout);

export default router;
