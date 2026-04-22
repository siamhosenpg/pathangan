// routes/message/message.routes.js
import express from "express";
import {
  getMessages,
  createMessage,
  deleteMessage,
} from "../../controllers/message/messageController.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.get("/:conversationId", protect, getMessages);

router.post("/", protect, createMessage);

router.delete("/:messageId", protect, deleteMessage);

export default router;
