import express from "express";
import { globalSearch } from "../../controllers/otherscontrollers/searchController.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.get("/search", protect, globalSearch);

export default router;
