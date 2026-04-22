// routes/message/conversation.routes.js
import express from "express";
import {
  getOrCreateConversation,
  getMyConversations,
  getConversationById,
} from "../../controllers/message/conversationController.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.post("/", protect, getOrCreateConversation);

router.get("/", protect, getMyConversations);
router.get("/:conversationId", protect, getConversationById);

export default router;
