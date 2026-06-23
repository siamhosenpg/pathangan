import Post from "../../models/postmodel.js";
import Reaction from "../../models/reactionModel.js";
import Follow from "../../models/followModel.js";
import { attachAnswerPreviews } from "../../helpers/attachAnswerPreviews.js";

// ===================== GET ALL POSTS (cursor-based, N+1 fixed) =====================
export const getPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
    const query = cursor ? { createdAt: { $lt: cursor } } : {};

    const posts = await Post.find(query)
      .populate("userid", "name username greenmarkVerified profileImage gender")
      .populate({
        path: "content.parentPost",
        populate: {
          path: "userid",
          select: "name username greenmarkVerified profileImage gender",
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    const userId = req.user?.id || null;

    // ── Reaction merge ────────────────────────────────────
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

    // ── Follow status merge (N+1 fix) ──────────────────────
    let followingSet = new Set();

    if (userId && posts.length > 0) {
      const authorIds = new Set();
      posts.forEach((post) => {
        if (post.userid?._id) authorIds.add(post.userid._id.toString());
        if (post.content?.parentPost?.userid?._id) {
          authorIds.add(post.content.parentPost.userid._id.toString());
        }
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

    // ── Final merge: isReacted + isFollowing ──────────────
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

      if (merged.content?.parentPost?.userid) {
        merged.content = {
          ...merged.content,
          parentPost: {
            ...merged.content.parentPost,
            userid: {
              ...merged.content.parentPost.userid,
              isFollowing: followingSet.has(
                merged.content.parentPost.userid._id.toString(),
              ),
            },
          },
        };
      }

      return merged;
    });

    // ── Answer preview merge — শুধু question type post এর জন্য (N+1 fix) ──
    finalPosts = await attachAnswerPreviews(finalPosts);
    // ─────────────────────────────────────────────────────

    res.json({
      posts: finalPosts,
      nextCursor: hasMore ? finalPosts[finalPosts.length - 1].createdAt : null,
    });
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ message: err.message });
  }
};
