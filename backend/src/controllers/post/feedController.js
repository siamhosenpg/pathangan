import Post from "../../models/postmodel.js";
import Reaction from "../../models/reactionModel.js";
import Follow from "../../models/followModel.js";
import { attachAnswerPreviews } from "../../helpers/attachAnswerPreviews.js";
import { getBlockedUserIds } from "../../helpers/blockHelper.js";

// ===================== GET ALL POSTS (cursor-based, N+1 fixed) =====================
export const getPosts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    let cursor = req.query.cursor ? new Date(req.query.cursor) : null;
    if (cursor && Number.isNaN(cursor.getTime())) cursor = null;

    const userId = req.user?.id || null;

    // ── Block filter: দুই দিকের blocked user ──
    const blockedIds = await getBlockedUserIds(userId);

    const query = {
      // শুধু public post; private কারো ফিডে আসবে না
      privacy: "public",
      moderationStatus: {
        $nin: ["deleted", "removed", "auto_hidden", "hidden"],
      },
      ...(cursor && { createdAt: { $lt: cursor } }),
      ...(blockedIds.length > 0 && { userid: { $nin: blockedIds } }),
    };

    const posts = await Post.find(query)
      .populate("userid", "name username greenmarkVerified profileImage gender")
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    const nextCursor =
      hasMore && posts.length > 0 ? posts[posts.length - 1].createdAt : null;

    // ── Reaction merge ──
    let reactedSet = new Set();

    if (userId && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const reactions = await Reaction.find({
        userId,
        postId: { $in: postIds },
      })
        .select("postId")
        .lean();
      reactedSet = new Set(reactions.map((r) => r.postId.toString()));
    }

    // ── Follow status merge (N+1 fix) ──
    let followingSet = new Set();

    if (userId && posts.length > 0) {
      const authorIds = new Set();
      posts.forEach((post) => {
        if (post.userid?._id) authorIds.add(post.userid._id.toString());
      });
      authorIds.delete(userId.toString());

      if (authorIds.size > 0) {
        const followings = await Follow.find({
          followerId: userId,
          followingId: { $in: Array.from(authorIds) },
        })
          .select("followingId")
          .lean();
        followingSet = new Set(followings.map((f) => f.followingId.toString()));
      }
    }

    // ── Final merge: isReacted + isFollowing ──
    let finalPosts = posts.map((post) => {
      const merged = {
        ...post,
        isReacted: reactedSet.has(post._id.toString()),
      };

      if (merged.userid) {
        merged.userid = {
          ...merged.userid,
          isFollowing: followingSet.has(merged.userid._id.toString()),
        };
      }

      // এই তথ্য সাধারণ ইউজারের কাছে যাবে না
      delete merged.moderationHistory;
      delete merged.reportCount;

      return merged;
    });

    // ── Answer preview merge — শুধু question type post এর জন্য ──
    finalPosts = await attachAnswerPreviews(finalPosts, blockedIds);

    res.json({ posts: finalPosts, nextCursor });
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ message: err.message });
  }
};
