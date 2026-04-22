// routes/savesystem/savedItem.routes.js

import express from "express";
import { protect } from "../../middleware/auth.js";

import {
  createSavedItem,
  deleteSavedItem,
  getSavedItems,
  checkIfSaved,
} from "../../controllers/savesystem/savedItemController.js";

const router = express.Router();

// protect all routes
router.use(protect);

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/

router.get("/check/:postId", checkIfSaved);

// GET all items inside a folder
router.get("/item/:collectionId", getSavedItems);

// Save new post to folder
router.post("/item/:collectionId", createSavedItem);

// Delete a saved item
router.delete("/item/delete/:postId", deleteSavedItem);

export default router;
