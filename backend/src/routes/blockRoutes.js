import express from "express";
import { protect } from "../middleware/auth.js"; // তোমার path অনুযায়ী
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  getBlockStatus,
} from "../controllers/blockController.js";

const router = express.Router();

router.get("/", protect, getBlockedUsers);
router.get("/status/:userId", protect, getBlockStatus);
router.post("/:userId", protect, blockUser);
router.delete("/:userId", protect, unblockUser);

export default router;
