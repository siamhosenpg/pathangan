// controllers/savesystem/savedItemController.js
import mongoose from "mongoose";
import SavedItem from "../../models/savesystem/savedItemSchema.js";
import SavedCollection from "../../models/savesystem/savedCollectionSchema.js";
import { getOrCreateDefaultCollection } from "./savedCollectionController.js";
import Reaction from "../../models/reactionModel.js";

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 30;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const sendError = (res, status, code, message) =>
  res.status(status).json({ code, message });

/*
|--------------------------------------------------------------------------
| CREATE: কোনো কালেকশনে পোস্ট সেভ করা ("default" দিলে ডিফল্ট কালেকশনে)
|--------------------------------------------------------------------------
*/
export const createSavedItem = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { postId } = req.body;
    const userId = req.user.id;

    if (!isValidId(postId)) {
      return sendError(res, 400, "INVALID_ID", "Invalid post id");
    }

    let collection;

    if (!collectionId || collectionId === "default") {
      collection = await getOrCreateDefaultCollection(userId);
    } else {
      if (!isValidId(collectionId)) {
        return sendError(res, 400, "INVALID_ID", "Invalid collection id");
      }
      // কালেকশনটা এই user এর কিনা যাচাই (অন্যের কালেকশনে সেভ করা যাবে না)
      collection = await SavedCollection.findOne({
        _id: collectionId,
        userId,
      });
      if (!collection) {
        return sendError(res, 404, "NOT_FOUND", "Collection not found!");
      }
    }

    const item = await SavedItem.create({
      collectionId: collection._id,
      userId,
      postId,
    });

    return res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return sendError(
        res,
        409,
        "ALREADY_SAVED",
        "This post is already saved in this collection!",
      );
    }
    return res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE: নির্দিষ্ট কালেকশন থেকে পোস্ট সরানো
|--------------------------------------------------------------------------
*/
export const deleteSavedItem = async (req, res) => {
  try {
    const { collectionId, postId } = req.params;

    if (!isValidId(collectionId) || !isValidId(postId)) {
      return sendError(res, 400, "INVALID_ID", "Invalid id");
    }

    const deleted = await SavedItem.findOneAndDelete({
      collectionId,
      postId,
      userId: req.user.id,
    });

    if (!deleted) {
      return sendError(res, 404, "NOT_FOUND", "Saved item not found!");
    }

    return res.json({ message: "Item removed successfully!" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET: কালেকশনের আইটেম — cursor based infinite scroll
| query: ?limit=10&cursor=<শেষ আইটেমের _id>
| response: { items, nextCursor, hasMore }
|--------------------------------------------------------------------------
*/
export const getSavedItems = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { cursor } = req.query;
    const userId = req.user.id;

    if (!isValidId(collectionId)) {
      return sendError(res, 400, "INVALID_ID", "Invalid collection id");
    }
    if (cursor && !isValidId(cursor)) {
      return sendError(res, 400, "INVALID_CURSOR", "Invalid cursor");
    }

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT, 1),
      MAX_PAGE_LIMIT,
    );

    const query = { collectionId, userId };
    if (cursor) query._id = { $lt: cursor };

    const rows = await SavedItem.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate({
        path: "postId",
        populate: {
          path: "userid",
          model: "User",
          select: "name username profileImage userid _id greenmarkVerified",
        },
      })
      .lean();

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? String(page[page.length - 1]._id) : null;

    // post ডিলিট (hard) হলে null, soft delete / removed হলে moderationStatus দেখে বাদ
    const HIDDEN_STATUSES = ["deleted", "removed", "auto_hidden"];
    const items = page.filter(
      (item) =>
        item.postId && !HIDDEN_STATUSES.includes(item.postId.moderationStatus),
    );

    // ── Reaction merge: এই পেজের সব post-এর isReacted একবারে বের করো ──
    let reactedSet = new Set();
    if (items.length > 0) {
      const postIds = items.map((item) => item.postId._id);
      const reactions = await Reaction.find({
        userId,
        postId: { $in: postIds },
      })
        .select("postId")
        .lean();
      reactedSet = new Set(reactions.map((r) => r.postId.toString()));
    }

    const itemsWithReaction = items.map((item) => ({
      ...item,
      postId: {
        ...item.postId,
        isReacted: reactedSet.has(item.postId._id.toString()),
      },
    }));

    return res.json({ items: itemsWithReaction, nextCursor, hasMore });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| CHECK: পোস্টটা কোন কোন কালেকশনে সেভ করা আছে
| response: { saved: boolean, collectionIds: string[] }
|--------------------------------------------------------------------------
*/
export const checkIfSaved = async (req, res) => {
  try {
    if (!isValidId(req.params.postId)) {
      return sendError(res, 400, "INVALID_ID", "Invalid post id");
    }

    const items = await SavedItem.find({
      postId: req.params.postId,
      userId: req.user.id,
    })
      .select("collectionId")
      .lean();

    const collectionIds = items.map((item) => String(item.collectionId));

    return res.json({ saved: collectionIds.length > 0, collectionIds });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
