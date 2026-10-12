import mongoose from "mongoose";
import User from "../../models/usermodel.js";
import Post from "../../models/postmodel.js";
import Handout from "../../models/handoutModel.js";
import { getBlockedUserIds } from "../../helpers/blockHelper.js";

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 30;
const PREVIEW_LIMIT = 3;
const MAX_WORDS = 8;
const MAX_QUERY_LENGTH = 100;

const VALID_TYPES = ["all", "users", "posts", "handouts"];

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

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildWordRegexes = (query) =>
  query
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_WORDS)
    .map((word) => new RegExp(escapeRegex(word), "i"));

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

// ===================== FILTERS (blockedIds সহ) =====================

const buildUserFilter = (regexes, blockedIds) => ({
  deletedAt: null,
  accountStatus: { $nin: HIDDEN_ACCOUNT_STATUSES },
  ...(blockedIds.length > 0 && { _id: { $nin: blockedIds } }),
  $or: regexes.flatMap((r) => [
    { name: { $regex: r } },
    { username: { $regex: r } },
  ]),
});

const buildPostFilter = (regexes, blockedIds) => ({
  moderationStatus: { $nin: HIDDEN_POST_STATUSES },
  deletedAt: null,
  privacy: { $nin: ["private", "friends"] },
  ...(blockedIds.length > 0 && { userid: { $nin: blockedIds } }),
  $or: [
    { $and: allWordsMatchField("content.title", regexes) },
    { $and: allWordsMatchField("content.text", regexes) },
    { $and: allWordsMatchField("course.title", regexes) },
    { $and: allWordsMatchField("course.description", regexes) },
    { $and: allWordsMatchField("question.questionText", regexes) },
  ],
});

const buildHandoutFilter = (regexes, blockedIds) => ({
  isDeleted: false,
  status: "published",
  ...(blockedIds.length > 0 && { user: { $nin: blockedIds } }),
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

const runPaginated = async (key, regexes, blockedIds, { limit, cursor }) => {
  const config = SEARCH_CONFIG[key];
  const baseFilter = config.buildFilter(regexes, blockedIds);

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
    .limit(limit + 1)
    .select(config.select);

  if (config.populate) q = q.populate(...config.populate);

  const docs = await q.lean();

  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor =
    hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1]._id : null;

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

    // একবারই blocked list আনা হচ্ছে (login না থাকলে খালি)
    const blockedIds = await getBlockedUserIds(req.user?.id);

    if (type === "all") {
      const [users, posts, handouts] = await Promise.all(
        ["users", "posts", "handouts"].map((key) =>
          runPaginated(key, regexes, blockedIds, {
            limit: PREVIEW_LIMIT,
            cursor: null,
          }),
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

    const { limit, cursor, cursorValid } = parsePagination(req.query);
    if (!cursorValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid cursor",
      });
    }

    const result = await runPaginated(type, regexes, blockedIds, {
      limit,
      cursor,
    });

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
