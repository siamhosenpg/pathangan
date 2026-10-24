import mongoose from "mongoose";
import Post from "../../models/postmodel.js";
import Reaction from "../../models/reactionModel.js";
import Follow from "../../models/followModel.js";
import { attachAnswerPreviews } from "../../helpers/attachAnswerPreviews.js";

import {
  getBlockRelation,
  getBlockedUserIds,
  isUserDeleted,
} from "../../helpers/blockHelper.js";

// ===================== GET POSTS BY USERID (N+1 fixed) =====================
export const getPostsByUserId = async (req, res) => {
  try {
    const userId = req.params.userid;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // ── ডিলিট হওয়া ইউজারের পোস্ট কেউ দেখতে পারবে না (login না থাকলেও) ──
    if (await isUserDeleted(userId)) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUserId = req.user?.id || null;

    // ── Block check ──
    if (currentUserId && currentUserId.toString() !== userId.toString()) {
      const relation = await getBlockRelation(currentUserId, userId);

      // সে আমাকে block করেছে → যেন user-ই নেই
      if (relation.blockedMe) {
        return res.status(404).json({ message: "User not found" });
      }

      // আমি তাকে block করেছি → খালি list
      if (relation.blockedByMe) {
        return res.status(200).json({
          posts: [],
          count: 0,
          nextCursor: null,
          isBlockedByMe: true,
        });
      }
    }

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
    const postType = req.query.postType || null;

    const query = {
      userid: userId,
      moderationStatus: { $nin: ["deleted", "removed", "auto_hidden"] },
    };
    if (cursor) query.createdAt = { $lt: cursor };
    if (postType) query.postType = postType;

    const posts = await Post.find(query)
      .populate(
        "userid",
        "name username greenmarkVerified bio profileImage gender",
      )
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    // ── Reaction merge ────────────────────────────────────
    let reactedSet = new Set();

    if (currentUserId && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const reactions = await Reaction.find({
        userId: currentUserId,
        postId: { $in: postIds },
      })
        .select("postId")
        .lean();
      reactedSet = new Set(reactions.map((r) => r.postId.toString()));
    }

    // ── Follow status merge (N+1 fix) ──────────────────────
    let followingSet = new Set();

    if (currentUserId && posts.length > 0) {
      const authorIds = new Set();
      posts.forEach((post) => {
        if (post.userid?._id) authorIds.add(post.userid._id.toString());
      });
      authorIds.delete(currentUserId.toString());

      if (authorIds.size > 0) {
        const followings = await Follow.find({
          followerId: currentUserId,
          followingId: { $in: Array.from(authorIds) },
        })
          .select("followingId")
          .lean();
        followingSet = new Set(followings.map((f) => f.followingId.toString()));
      }
    }

    // ── Final merge ────────────────────────────────────────
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
      return merged;
    });

    const blockedIds = await getBlockedUserIds(currentUserId);
    finalPosts = await attachAnswerPreviews(finalPosts, blockedIds);

    return res.status(200).json({
      posts: finalPosts,
      count: finalPosts.length,
      nextCursor: hasMore ? finalPosts[finalPosts.length - 1].createdAt : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
