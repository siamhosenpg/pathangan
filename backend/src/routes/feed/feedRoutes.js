import express from "express";
import { protect } from "../../middleware/auth.js";
import { optionalProtect } from "../../middleware/optionalProtect.js";
import { getForYouFeed } from "../../controllers/feed/forYouController.js";
import {
  getCategories,
  getMyInterests,
  setMyInterests,
  resetMyInterests,
  markNotInterested,
} from "../../controllers/feed/interestController.js";
import { recordImpressions } from "../../controllers/feed/impressionController.js";

const router = express.Router();

router.get("/for-you", optionalProtect, getForYouFeed);
router.get("/categories", getCategories);
router.get("/interests", protect, getMyInterests);
router.put("/interests", protect, setMyInterests);
router.delete("/interests", protect, resetMyInterests);
router.post("/not-interested", protect, markNotInterested);
router.post("/impressions", protect, recordImpressions);

export default router;
