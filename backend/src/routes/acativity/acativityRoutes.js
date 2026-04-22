import express from "express";
import {
  getUserActivities,
  getLastFourUserActivities,
} from "../../controllers/activities/activitesController.js";
import { protect } from "../../middleware/auth.js";
const router = express.Router();

// 🏃‍♂️ Get user activities
router.get("/", protect, getUserActivities);
router.get("/last", protect, getLastFourUserActivities);

export default router;
