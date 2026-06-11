import express from "express";
import passport from "../config/passport.js";
import { protect } from "../middleware/auth.js";
import {
  googleCallback,
  googleMobileAuth,
} from "../controllers/googleAuthController.js";

const router = express.Router();

// ── Web Flow ──────────────────────────────────────────────────────────────────

// Step 1: Google login page এ নিয়ে যাবে
// Frontend: <a href="/api/auth/google">Login with Google</a>
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// Step 2: Google আবার এখানে ফিরে আসবে
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
  }),
  googleCallback,
);

// ── Mobile Flow ───────────────────────────────────────────────────────────────

// Expo app থেকে POST করবে — JWT ফিরে পাবে
router.post("/google/mobile", googleMobileAuth);

export default router;
