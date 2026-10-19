// routes/privateAnswer/privateAnswerRoutes.js
import express from "express";
import {
  createPrivateAnswer,
  getPrivateAnswerByQuestion,
  editPrivateAnswer,
  deletePrivateAnswer,
} from "../../controllers/privateAnswer/privateAnswerController.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.post("/:questionId", protect, createPrivateAnswer);
router.get("/:questionId", protect, getPrivateAnswerByQuestion);
router.patch("/:answerId", protect, editPrivateAnswer);
router.delete("/:answerId", protect, deletePrivateAnswer);

export default router;
