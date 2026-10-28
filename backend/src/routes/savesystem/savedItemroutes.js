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

router.use(protect);

// পোস্টটা কোন কোন কালেকশনে সেভ আছে
router.get("/check/:postId", checkIfSaved);

// কালেকশনের আইটেম (infinite scroll)
router.get("/item/:collectionId", getSavedItems);

// কালেকশনে পোস্ট সেভ ("default" দিলে ডিফল্টে)
router.post("/item/:collectionId", createSavedItem);

// নির্দিষ্ট কালেকশন থেকে পোস্ট সরানো
router.delete("/item/:collectionId/:postId", deleteSavedItem);

export default router;
