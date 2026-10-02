import mongoose from "mongoose";
import User from "../../models/usermodel.js";
import Post from "../../models/postmodel.js";
import Handout from "../../models/handoutModel.js"; // তোমার handout model-এর path অনুযায়ী ঠিক করো

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 30;
const PREVIEW_LIMIT = 3;
const MAX_WORDS = 8;
const MAX_QUERY_LENGTH = 100;

const VALID_TYPES = ["all", "users", "posts", "handouts"];

// এই status-এর account/post সার্চে আসবে না
const HIDDEN_ACCOUNT_STATUSES = [
  "suspended",
  "banned",
  "deactivated",
  "deleted",
];
const HIDDEN_POST_STATUSES = [
  "under_review",
  "hidden",
  "auto_hidden",
  "removed",
  "deleted",
];

// ===================== HELPERS =====================

// user-এর লেখা text-এ regex-এর special character থাকলে escape করো
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildWordRegexes = (query) =>
  query
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_WORDS)
    .map((word) => new RegExp(escapeRegex(word), "i"));

// একটা field-এ সব word match করার condition
const allWordsMatchField = (field, regexes) =>
  regexes.map((regex) => ({ [field]: { $regex: regex } }));

const parsePagination = (query) => {
  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const cursor = query.cursor || null;
  const cursorValid = !cursor || mongoose.Types.ObjectId.isValid(cursor);

  return { limit, cursor, cursorValid };
};

// ===================== FILTERS =====================

// user: name বা username-এ যেকোনো একটা word থাকলেই হবে
const buildUserFilter = (regexes) => ({
  deletedAt: null,
  accountStatus: { $nin: HIDDEN_ACCOUNT_STATUSES },
  $or: regexes.flatMap((r) => [
    { name: { $regex: r } },
    { username: { $regex: r } },
  ]),
});

// post: soft delete / hidden / private বাদ, আর কোনো একটা field-এ সব word থাকতে হবে
const buildPostFilter = (regexes) => ({
  moderationStatus: { $nin: HIDDEN_POST_STATUSES },
  deletedAt: null,
  privacy: { $nin: ["private", "friends"] },
  $or: [
    { $and: allWordsMatchField("content.title", regexes) },
    { $and: allWordsMatchField("content.text", regexes) },
    { $and: allWordsMatchField("course.title", regexes) },
    { $and: allWordsMatchField("course.description", regexes) },
    { $and: allWordsMatchField("question.questionText", regexes) },
  ],
});

// handout: soft delete বাদ, শুধু published
const buildHandoutFilter = (regexes) => ({
  isDeleted: false,
  status: "published",
  $or: [
    { $and: allWordsMatchField("title", regexes) },
    { $and: allWordsMatchField("description", regexes) },
    { $and: allWordsMatchField("tags", regexes) },
  ],
});

// ===================== CONFIG =====================

const SEARCH_CONFIG = {
  users: {
    model: User,
    buildFilter: buildUserFilter,
    select: "_id name username userid profileImage greenmarkVerified",
    populate: null,
    ownerField: null,
  },
  posts: {
    model: Post,
    buildFilter: buildPostFilter,
    select:
      "_id postType content course question createdAt userid likesCount commentsCount",
    populate: ["userid", "name username profileImage greenmarkVerified"],
    ownerField: "userid",
  },
  handouts: {
    model: Handout,
    buildFilter: buildHandoutFilter,
    select:
      "_id user title slug description coverImage category chaptersCount estimatedReadTime likesCount price currency createdAt",
    populate: ["user", "name username profileImage greenmarkVerified"],
    ownerField: "user",
  },
};

// ===================== CORE: cursor pagination =====================

const runPaginated = async (key, regexes, { limit, cursor }) => {
  const config = SEARCH_CONFIG[key];
  const baseFilter = config.buildFilter(regexes);

  const filter = cursor
    ? {
        $and: [
          baseFilter,
          { _id: { $lt: new mongoose.Types.ObjectId(cursor) } },
        ],
      }
    : baseFilter;

  let q = config.model
    .find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1) // একটা বেশি আনছি, আরও data আছে কিনা বোঝার জন্য
    .select(config.select);

  if (config.populate) q = q.populate(...config.populate);

  const docs = await q.lean();

  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor =
    hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1]._id : null;

  // owner delete হয়ে গেলে populate null হয়, সেগুলো বাদ
  const items = config.ownerField
    ? pageDocs.filter((d) => d[config.ownerField])
    : pageDocs;

  return { items, nextCursor, hasMore };
};

// ===================== CONTROLLER =====================

export const globalSearch = async (req, res) => {
  try {
    const query = req.query.q?.trim().slice(0, MAX_QUERY_LENGTH);

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const type = VALID_TYPES.includes(req.query.type) ? req.query.type : "all";
    const regexes = buildWordRegexes(query);

    if (regexes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // ---------- ALL: প্রতিটার preview ----------
    if (type === "all") {
      const [users, posts, handouts] = await Promise.all(
        ["users", "posts", "handouts"].map((key) =>
          runPaginated(key, regexes, { limit: PREVIEW_LIMIT, cursor: null }),
        ),
      );

      return res.status(200).json({
        success: true,
        users: users.items,
        posts: posts.items,
        handouts: handouts.items,
        hasMore: {
          users: users.hasMore,
          posts: posts.hasMore,
          handouts: handouts.hasMore,
        },
      });
    }

    // ---------- নির্দিষ্ট tab: infinite scroll ----------
    const { limit, cursor, cursorValid } = parsePagination(req.query);
    if (!cursorValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid cursor",
      });
    }

    const result = await runPaginated(type, regexes, { limit, cursor });

    return res.status(200).json({
      success: true,
      type,
      items: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};
