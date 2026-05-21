import express from "express";
import {
  getAllQuestions,
  getQuestionsByUserId,
  getQuestionById,
} from "../../controllers/post/questionPostController.js";
import { optionalProtect } from "../../middleware/optionalProtect.js";

const router = express.Router();

router.get("/", optionalProtect, getAllQuestions);
router.get("/user/:userid", optionalProtect, getQuestionsByUserId);
router.get("/:id", optionalProtect, getQuestionById);

export default router;
