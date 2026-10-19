import express from "express";
import {
  sendPrivateQuestion,
  getInbox,
  getSentQuestions,
  getPrivateQuestionPeople,
  getQuestionsWithUser,
  getPrivateQuestionById,
  editPrivateQuestion,
  updateQuestionStatus,
  getUnreadCount,
  deletePrivateQuestion,
} from "../controllers/privateQuestionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", sendPrivateQuestion);
router.get("/inbox", getInbox);
router.get("/sent", getSentQuestions);
router.get("/people", getPrivateQuestionPeople); // কার কার সাথে প্রশ্ন আছে
router.get("/with/:userId", getQuestionsWithUser); // একজনের সাথে প্রশ্নগুলো
router.get("/unread-count", getUnreadCount);

// ⚠️ /:id সবসময় নিচে থাকবে
router.get("/:id", getPrivateQuestionById);
router.patch("/:id/status", updateQuestionStatus);
router.patch("/:id", editPrivateQuestion);
router.delete("/:id", deletePrivateQuestion);

export default router;
