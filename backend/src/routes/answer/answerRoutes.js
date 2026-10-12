import express from "express";
import { protect, optionalAuth } from "../../middleware/auth.js";
import {
  createAnswer,
  getAnswersByQuestion,
  getAnswerById,
  updateAnswer,
  deleteAnswer,
  markBestAnswer,
  voteAnswer,
  getMyAnswers,
  getAnswerCount,
} from "../../controllers/answer/answerController.js";

const router = express.Router();

router.get("/my", protect, getMyAnswers);
router.get("/question/:questionId/count", optionalAuth, getAnswerCount);
router.get("/question/:questionId", optionalAuth, getAnswersByQuestion);
router.get("/:answerId", optionalAuth, getAnswerById);

router.post("/question/:questionId", protect, createAnswer);

router.put("/:answerId", protect, updateAnswer);
router.delete("/:answerId", protect, deleteAnswer);
router.patch("/:answerId/best", protect, markBestAnswer);
router.patch("/:answerId/vote", protect, voteAnswer);

export default router;
