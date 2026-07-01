import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./src/config/db.js";

import passport from "./src/config/passport.js";
import Post from "./src/models/postmodel.js";

// dfadfadf
import { runMigration } from "./src/scripts/runMigration.js";
import { protect } from "./src/middleware/auth.js";
import { adminOnly } from "./src/middleware/adminOnly.js";

// রুট ইম্পোর্ট

import googleAuthRoutes from "./src/routes/googleAuthRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import moderationRoutes from "./src/routes/otherroutes/moderationRoutes.js";
import postsRoute from "./src/routes/postsroute.js";
import questionRoutes from "./src/routes/post/questionRoute.js";
import courseRoutes from "./src/routes/post/courseRoutes.js";
import answerRoutes from "./src/routes/answer/answerRoutes.js";
import usersRoute from "./src/routes/usersroute.js";
import reactionRoutes from "./src/routes/reactionRoutes.js";
import commentRoutes from "./src/routes/commentRoutes.js";
import followroutes from "./src/routes/followRoutes.js";
import savedCollectionRoutes from "./src/routes/savesystem/savedCollectionroutes.js";
import savedItemRoutes from "./src/routes/savesystem/savedItemroutes.js";
import ratingRoutes from "./src/routes/rating/ratingRoutes.js";
import notificationRoutes from "./src/routes/notification/notificationroutes.js";
import searchRoutes from "./src/routes/otherroutes/searchRoute.js";
import videoPostRoutes from "./src/routes/post/videopostroute.js";
import discoverRoutes from "./src/routes/post/discoverRoute.js";
import peopleRoutes from "./src/routes/user/peopleRoutes.js";
import messageRoutes from "./src/routes/message/messageRoutes.js";
import conversationRoutes from "./src/routes/message/conversationRoutes.js";
import activityRoutes from "./src/routes/acativity/acativityRoutes.js";
import privateQuestionRoutes from "./src/routes/privateQuestionRoutes.js";
import privateAnswerRoutes from "./src/routes/answer/privateAnswer.js";
import { optionalAuth } from "./src/middleware/auth.js";

import handoutRoutes from "./src/routes/handout/handoutRoutes.js";
import chapterRoutes from "./src/routes/handout/chapterRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// ── ১. প্রক্সি ট্রাস্ট (Render/Vercel এর জন্য দরকার) ──
app.set("trust proxy", 1);

// ── ২. সিকিউরিটি হেডার ──
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

// ── ৩. CORS ──
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:8081",
        "https://pathangan.vercel.app",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── ৪. বডি পার্সার ও কুকি — লিমিটারের আগে রাখতে হবে ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── ৫. রেট লিমিটার ──

// সাধারণ সব রুটের জন্য — ১৫ মিনিটে ২০০ রিকোয়েস্ট
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// শুধু login ও register এর জন্য — dev এ ১০০, production এ ১০
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, try again later." },
});

app.use(passport.initialize());
// সব রুটে generalLimiter গ্লোবালি লাগানো
app.use(generalLimiter);

// ── ৬. রুটস ──

// শুধু login ও register এ authLimiter — logout এ লাগবে না
// authLimiter আগে রেজিস্টার করতে হবে authRoutes এর আগে
app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);

// auth এর বাকি সব রুট স্বাভাবিকভাবে
app.use("/googleauth", googleAuthRoutes);
app.use("/auth", authRoutes);
app.use("/moderation", moderationRoutes);
app.use("/posts", postsRoute);
app.use("/users", usersRoute);
app.use("/answers", answerRoutes);
app.use("/reactions", reactionRoutes);
app.use("/comments", commentRoutes);
app.use("/questions", questionRoutes);
app.use("/courses", courseRoutes);
app.use("/follows", followroutes);
app.use("/saves/collections", savedCollectionRoutes);
app.use("/ratings", ratingRoutes);
app.use("/items", savedItemRoutes);
app.use("/notifications", notificationRoutes);
app.use("/search", searchRoutes);
app.use("/videos", videoPostRoutes);
app.use("/discovers", discoverRoutes);
app.use("/peoples", peopleRoutes);
app.use("/messages", messageRoutes);
app.use("/conversations", conversationRoutes);
app.use("/activities", activityRoutes);
app.use("/private-questions", privateQuestionRoutes);
app.use("/private-answers", privateAnswerRoutes);
app.use("/handouts", handoutRoutes);
app.use("/chapters", chapterRoutes);
// ── ৭. টেস্ট ও মিসেলেনিয়াস রুট ──

app.get("/", (req, res) => res.send("API is running..."));

// লগইন থাকলে user info, না থাকলে guest দেখাবে
app.get("/maybe", optionalAuth, (req, res) => {
  if (req.user)
    return res.json({ message: "Hello logged-in user", userId: req.user.id });
  return res.json({ message: "Hello guest" });
});

// এনভায়রনমেন্ট চেক
app.get("/test-env", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === "production",
  });
});

app.get("/fix-views", async (req, res) => {
  const result = await Post.updateMany(
    { viewsCount: { $exists: false } },
    { $set: { viewsCount: 0 } },
  );
  res.json(result);
});

// অন্য routes এর সাথে:
app.get("/run-migration", protect, adminOnly, runMigration);

// ── ৮. ৪০৪ হ্যান্ডলার — সব রুটের একদম শেষে থাকবে ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ── ৯. DB কানেক্ট করে সার্ভার চালু ──
(async () => {
  await connectDB();
  app.listen(port, () =>
    console.log(`Server running http://localhost:${port}`),
  );
})();
