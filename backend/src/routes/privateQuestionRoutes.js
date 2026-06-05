import express from "express";
import {
  sendPrivateQuestion,
  getInbox,
  getSentQuestions,
  getPrivateQuestionById,
  updateQuestionStatus,
  getUnreadCount,
  deletePrivateQuestion,
} from "../controllers/privateQuestionController.js";
import { protect } from "../middleware/auth.js"; // তোর existing auth middleware

const router = express.Router();

// সব route-ই protected — login ছাড়া access নেই
router.use(protect);

router.post("/", sendPrivateQuestion); // question পাঠাও
router.get("/inbox", getInbox); // আমার inbox
router.get("/sent", getSentQuestions); // আমি যা পাঠিয়েছি
router.get("/unread-count", getUnreadCount); // unread badge count
router.get("/:id", getPrivateQuestionById); // single question
router.patch("/:id/status", updateQuestionStatus); // status update
router.delete("/:id", deletePrivateQuestion); // delete

export default router;
