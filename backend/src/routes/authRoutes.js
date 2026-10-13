import express from "express";
import {
  register,
  login,
  getMe,
  logout,
} from "../controllers/authController.js";

import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/logout", optionalAuth, logout);

export default router;
