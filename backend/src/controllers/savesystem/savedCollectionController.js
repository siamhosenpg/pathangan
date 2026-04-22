// controllers/savedCollection.controller.js
import SavedCollection from "../../models/savesystem/savedCollectionSchema.js";

/*
|--------------------------------------------------------------------------
| GET Default Collection of logged-in user
|--------------------------------------------------------------------------
*/
export const getDefaultCollection = async (req, res) => {
  try {
    // Step 1: default collection আছে কিনা check
    let defaultCollection = await SavedCollection.findOne({
      userId: req.user.id,
      default: true,
    });

    // Step 2: যদি default না থাকে → auto-create করে দাও
    if (!defaultCollection) {
      defaultCollection = await SavedCollection.create({
        userId: req.user.id,
        name: "Saved", // Default folder name
        default: true, // Mark as default
      });
    }

    res.json({
      collectionId: defaultCollection._id,
      name: defaultCollection.name,
      default: defaultCollection.default,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE Folder
|--------------------------------------------------------------------------
*/
export const createCollection = async (req, res) => {
  try {
    const collection = await SavedCollection.create({
      userId: req.user.id,
      name: req.body.name,
    });

    res.status(201).json(collection);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Folder with this name already exists!" });
    }
    res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET all collections of logged-in user
|--------------------------------------------------------------------------
*/
export const getCollections = async (req, res) => {
  try {
    const collections = await SavedCollection.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE Folder (only if owner)
|--------------------------------------------------------------------------
*/
export const updateCollection = async (req, res) => {
  try {
    const updated = await SavedCollection.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // Only own folder
      { name: req.body.name },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Folder not found!" });
    }

    res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Folder name already exists!" });
    }
    res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE Folder (only if owner)
|--------------------------------------------------------------------------
*/
export const deleteCollection = async (req, res) => {
  try {
    const deleted = await SavedCollection.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Folder not found!" });
    }

    res.json({ message: "Folder deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET Single Folder (for details page)
|--------------------------------------------------------------------------
*/
export const getSingleCollection = async (req, res) => {
  try {
    const folder = await SavedCollection.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found!" });
    }

    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
