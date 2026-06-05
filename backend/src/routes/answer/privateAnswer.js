// routes/privateAnswer/privateAnswerRoutes.js
import express from "express";
import {
  createPrivateAnswer,
  getPrivateAnswerByQuestion,
} from "../../controllers/privateAnswer/privateAnswerController.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.post("/:questionId", protect, createPrivateAnswer);
router.get("/:questionId", protect, getPrivateAnswerByQuestion);

export default router;
