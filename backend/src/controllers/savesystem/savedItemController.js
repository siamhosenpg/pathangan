// controllers/savesystem/savedItemController.js

import SavedItem from "../../models/savesystem/savedItemSchema.js";
import SavedCollection from "../../models/savesystem/savedCollectionSchema.js";

/*
|--------------------------------------------------------------------------
| CREATE: Save a post in a collection (with auto default folder)
|--------------------------------------------------------------------------
*/
export const createSavedItem = async (req, res) => {
  try {
    let { collectionId } = req.params;
    const userId = req.user.id;

    // If no collectionId or user uses "default", then use or create default folder
    if (!collectionId || collectionId === "default") {
      let defaultFolder = await SavedCollection.findOne({
        userId,
        default: true,
      });

      // If default folder does not exist → create it
      if (!defaultFolder) {
        defaultFolder = await SavedCollection.create({
          userId,
          name: "Saved Posts",
          description: "Default collection",
          default: true,
        });
      }

      collectionId = defaultFolder._id;
    }

    // Create saved item
    const item = await SavedItem.create({
      collectionId,
      userId,
      postId: req.body.postId,
    });

    return res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "This post is already saved in this folder!" });
    }
    return res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE: Remove saved item
|--------------------------------------------------------------------------
*/
export const deleteSavedItem = async (req, res) => {
  try {
    const deleted = await SavedItem.findOneAndDelete({
      postId: req.params.postId,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Saved item not found!" });
    }

    return res.json({ message: "Item removed successfully!" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET: All items of a specific folder
|--------------------------------------------------------------------------
*/
export const getSavedItems = async (req, res) => {
  try {
    const items = await SavedItem.find({
      collectionId: req.params.collectionId,
      userId: req.user.id,
    })
      .populate({
        path: "postId",
        populate: {
          path: "userid", // post model-এ যে field টি user ref করে রাখছো
          model: "User", // তোমার User model নাম
          select: "name username profileImage userid _id", // শুধু প্রয়োজনীয় ফিল্ড
        },
      })
      .sort({ createdAt: -1 });

    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------
| CHECK: Is post already saved by user?
|--------------------------------------------------------------------
*/
export const checkIfSaved = async (req, res) => {
  try {
    const exists = await SavedItem.findOne({
      postId: req.params.postId,
      userId: req.user.id,
    });

    return res.json({ saved: !!exists });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
