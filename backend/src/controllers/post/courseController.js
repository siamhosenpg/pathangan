import mongoose from "mongoose";
import Post from "../../models/postmodel.js";
import Reaction from "../../models/reactionModel.js";

// ===================== GET ALL COURSE POSTS (cursor-based) =====================
export const getAllCourses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const query = { postType: "course" };
    if (cursor) query.createdAt = { $lt: cursor };

    const courses = await Post.find(query)
      .populate("userid", "name username greenmarkVerified profileImage gender")
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = courses.length > limit;
    if (hasMore) courses.pop();

    // ── Reaction merge ────────────────────────────────────
    const userId = req.user?.id || null;
    let reactedSet = new Set();

    if (userId && courses.length > 0) {
      const postIds = courses.map((c) => c._id);

      const reactions = await Reaction.find({
        userId,
        postId: { $in: postIds },
      })
        .select("postId")
        .lean();

      reactedSet = new Set(reactions.map((r) => r.postId.toString()));
    }

    const finalCourses = courses.map((c) => ({
      ...c,
      isReacted: reactedSet.has(c._id.toString()),
    }));
    // ─────────────────────────────────────────────────────

    res.json({
      courses: finalCourses,
      nextCursor: hasMore
        ? finalCourses[finalCourses.length - 1].createdAt
        : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================== GET COURSE POSTS BY USERID =====================
export const getCoursesByUserId = async (req, res) => {
  try {
    const { userid } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const query = { userid, postType: "course" };
    if (cursor) query.createdAt = { $lt: cursor };

    const courses = await Post.find(query)
      .populate("userid", "name username greenmarkVerified profileImage gender")
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = courses.length > limit;
    if (hasMore) courses.pop();

    // ── Reaction merge ────────────────────────────────────
    const currentUserId = req.user?.id || null;
    let reactedSet = new Set();

    if (currentUserId && courses.length > 0) {
      const postIds = courses.map((c) => c._id);

      const reactions = await Reaction.find({
        userId: currentUserId,
        postId: { $in: postIds },
      })
        .select("postId")
        .lean();

      reactedSet = new Set(reactions.map((r) => r.postId.toString()));
    }

    const finalCourses = courses.map((c) => ({
      ...c,
      isReacted: reactedSet.has(c._id.toString()),
    }));
    // ─────────────────────────────────────────────────────

    return res.status(200).json({
      courses: finalCourses,
      count: finalCourses.length,
      nextCursor: hasMore
        ? finalCourses[finalCourses.length - 1].createdAt
        : null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET SINGLE COURSE BY ID =====================
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const course = await Post.findOne({ _id: id, postType: "course" })
      .populate(
        "userid",
        "name username greenmarkVerified bio profileImage gender",
      )
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // ── Reaction check (single course) ───────────────────
    const userId = req.user?.id || null;
    let isReacted = false;

    if (userId) {
      const reaction = await Reaction.findOne({
        userId,
        postId: course._id,
      }).lean();

      isReacted = !!reaction;
    }
    // ─────────────────────────────────────────────────────

    res.json({ ...course, isReacted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
