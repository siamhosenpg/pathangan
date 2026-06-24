import express from "express";
import {
  createReport,
  deletePost,
  changePostStatus,
  changeUserStatus,
  deactivateAccount,
  getReports,
  resolveReport,
} from "../../controllers/otherscontrollers/reportController.js";
import { protect } from "../../middleware/auth.js";
import { adminOnly } from "../../middleware/adminOnly.js";

const router = express.Router();

// ── User actions ──────────────────────────
router.post("/report", protect, createReport);
router.delete("/post/:postId", protect, deletePost);
router.patch("/account/deactivate", protect, deactivateAccount);

// ── Admin only ────────────────────────────
router.patch("/post/:postId/status", protect, adminOnly, changePostStatus);
router.patch("/user/:userId/status", protect, adminOnly, changeUserStatus);
router.get("/reports", protect, adminOnly, getReports);
router.patch("/reports/:reportId/resolve", protect, adminOnly, resolveReport);

export default router;
