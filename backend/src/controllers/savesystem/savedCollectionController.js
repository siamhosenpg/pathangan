// controllers/savesystem/savedCollectionController.js
import mongoose from "mongoose";
import SavedCollection from "../../models/savesystem/savedCollectionSchema.js";
import SavedItem from "../../models/savesystem/savedItemSchema.js";

// ডিফল্ট কালেকশনের নাম (অ্যাপে এটা অনুবাদ করে দেখানো হয়)
export const DEFAULT_COLLECTION_NAME = "Saved";
const MAX_NAME_LENGTH = 40;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ফ্রন্টএন্ড যেন code দেখে নিজের ভাষায় বার্তা দেখাতে পারে
const sendError = (res, status, code, message) =>
  res.status(status).json({ code, message });

// নাম যাচাই: খালি, অতিরিক্ত লম্বা, বা ডিফল্ট নামের সমান হলে আটকাবে
const validateName = (rawName) => {
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (!name) {
    return { status: 400, code: "NAME_EMPTY", message: "Name is required" };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return {
      status: 400,
      code: "NAME_TOO_LONG",
      message: `Name can be at most ${MAX_NAME_LENGTH} characters`,
    };
  }
  if (name.toLowerCase() === DEFAULT_COLLECTION_NAME.toLowerCase()) {
    return {
      status: 409,
      code: "NAME_RESERVED",
      message: "This name is reserved",
    };
  }
  return { name };
};

/*
|--------------------------------------------------------------------------
| Helper: ডিফল্ট কালেকশন আনো, না থাকলে বানাও (অন্য controller ও এটা ব্যবহার করে)
|--------------------------------------------------------------------------
*/
export const getOrCreateDefaultCollection = async (userId) => {
  const existing = await SavedCollection.findOne({ userId, default: true });
  if (existing) return existing;

  try {
    return await SavedCollection.create({
      userId,
      name: DEFAULT_COLLECTION_NAME,
      default: true,
    });
  } catch (err) {
    // একসাথে দুইটা request এলে একটা create ফেল করবে — তখন আবার খুঁজে নাও
    if (err.code === 11000) {
      const created = await SavedCollection.findOne({
        userId,
        default: true,
      });
      if (created) return created;
    }
    throw err;
  }
};

/*
|--------------------------------------------------------------------------
| GET Default Collection of logged-in user
|--------------------------------------------------------------------------
*/
export const getDefaultCollection = async (req, res) => {
  try {
    const defaultCollection = await getOrCreateDefaultCollection(req.user.id);

    res.json({
      _id: defaultCollection._id,
      name: defaultCollection.name,
      default: defaultCollection.default,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE Collection
|--------------------------------------------------------------------------
*/
export const createCollection = async (req, res) => {
  try {
    const checked = validateName(req.body?.name);
    if (!checked.name) {
      return sendError(res, checked.status, checked.code, checked.message);
    }

    const collection = await SavedCollection.create({
      userId: req.user.id,
      name: checked.name,
    });

    res.status(201).json(collection);
  } catch (err) {
    if (err.code === 11000) {
      return sendError(
        res,
        409,
        "NAME_EXISTS",
        "Collection with this name already exists!",
      );
    }
    res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET all collections of logged-in user (ডিফল্ট সবসময় আগে)
|--------------------------------------------------------------------------
*/
export const getCollections = async (req, res) => {
  try {
    const collections = await SavedCollection.find({
      userId: req.user.id,
    }).sort({ default: -1, createdAt: -1 });

    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE Collection (শুধু মালিক, ডিফল্ট এডিট করা যাবে না)
|--------------------------------------------------------------------------
*/
export const updateCollection = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, "INVALID_ID", "Invalid collection id");
    }

    const checked = validateName(req.body?.name);
    if (!checked.name) {
      return sendError(res, checked.status, checked.code, checked.message);
    }

    const collection = await SavedCollection.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!collection) {
      return sendError(res, 404, "NOT_FOUND", "Collection not found!");
    }
    if (collection.default) {
      return sendError(
        res,
        400,
        "DEFAULT_LOCKED",
        "Default collection cannot be changed",
      );
    }

    collection.name = checked.name;
    await collection.save();

    res.json(collection);
  } catch (err) {
    if (err.code === 11000) {
      return sendError(
        res,
        409,
        "NAME_EXISTS",
        "Collection name already exists!",
      );
    }
    res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE Collection — ভেতরের সব saved item ডাটাবেস থেকে স্থায়ীভাবে মুছবে
|--------------------------------------------------------------------------
*/
export const deleteCollection = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, "INVALID_ID", "Invalid collection id");
    }

    const collection = await SavedCollection.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!collection) {
      return sendError(res, 404, "NOT_FOUND", "Collection not found!");
    }
    if (collection.default) {
      return sendError(
        res,
        400,
        "DEFAULT_LOCKED",
        "Default collection cannot be deleted",
      );
    }

    // আগে আইটেম মোছা হয়, তারপর কালেকশন।
    // মাঝপথে ফেল করলে কালেকশন থেকে যায়, user আবার ডিলিট চেষ্টা করতে পারবে
    // (উল্টোটা হলে ঝুলন্ত আইটেম ডাটাবেসে থেকে যেত)
    const result = await SavedItem.deleteMany({
      collectionId: collection._id,
      userId: req.user.id,
    });
    await SavedCollection.deleteOne({ _id: collection._id });

    res.json({
      message: "Collection deleted successfully!",
      deletedItems: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET Single Collection
|--------------------------------------------------------------------------
*/
export const getSingleCollection = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, "INVALID_ID", "Invalid collection id");
    }

    const collection = await SavedCollection.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!collection) {
      return sendError(res, 404, "NOT_FOUND", "Collection not found!");
    }

    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
