import express from "express";
import {
  getAllQuestions,
  getQuestionsByUserId,
  getQuestionById,
} from "../../controllers/post/questionPostController.js";

const router = express.Router();

router.get("/", getAllQuestions);
router.get("/user/:userid", getQuestionsByUserId);
router.get("/:id", getQuestionById);

export default router;
