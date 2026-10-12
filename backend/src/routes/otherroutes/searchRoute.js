import express from "express";
import { globalSearch } from "../../controllers/otherscontrollers/searchController.js";
import { optionalAuth } from "../../middleware/auth.js";

const router = express.Router();

router.get("/search", optionalAuth, globalSearch);

export default router;
