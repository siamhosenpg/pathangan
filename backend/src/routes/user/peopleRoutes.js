import express from "express";
import { getPeople } from "../../controllers/user/peopleController.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

// 🔐 Get people suggestions (login required)
router.get("/suggestions", protect, getPeople);

export default router;
