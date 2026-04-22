// routes/savedCollection.routes.js
import express from "express";
import {
  getDefaultCollection,
  createCollection,
  getCollections,
  updateCollection,
  deleteCollection,
  getSingleCollection,
} from "../../controllers/savesystem/savedCollectionController.js";

import { protect } from "../../middleware/auth.js";

const router = express.Router();

// All routes require login
router.use(protect);

router.get("/saved/default", getDefaultCollection);
// Create new folder
router.post("/", createCollection);

// Get ALL folders of logged user
router.get("/", getCollections);

// Get one folder
router.get("/:id", getSingleCollection);

// Update folder
router.put("/:id", updateCollection);

// Delete folder
router.delete("/:id", deleteCollection);

export default router;
