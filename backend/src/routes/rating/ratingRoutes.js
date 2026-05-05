import express from "express";
import {
  giveRating,
  getRatingsByAnswer,
  getMyRating,
  deleteRating,
  getRatingsByQuestion,
  getUserAverageRating,
} from "../../controllers/rating/ratingController.js";
import { protect } from "../../middleware/auth.js"; // তোমার existing auth middleware

const router = express.Router();

// Answer এ rating দেওয়া বা update করা
router.post("/answer/:answerId", protect, giveRating);

// Answer এর average rating ও count দেখা (public)
router.get("/answer/:answerId", getRatingsByAnswer);

// আমার নিজের rating দেখা (logged in)
router.get("/answer/:answerId/my", protect, getMyRating);

// Rating সরিয়ে দেওয়া
router.delete("/answer/:answerId", protect, deleteRating);

// একটি question এর সব answer এর rating এক সাথে দেখা
router.get("/question/:questionId", getRatingsByQuestion);
// একটি user এর average rating দেখা
router.get("/user/:userId", getUserAverageRating);

export default router;
