import Post from "../../models/postmodel.js";
import Reaction from "../../models/reactionModel.js";
import Follow from "../../models/followModel.js";
import { attachAnswerPreviews } from "../attachAnswerPreviews.js";
import { FEED_CONFIG } from "./feedConfig.js";

const USER_FIELDS = "name username greenmarkVerified profileImage gender";

// post ID-র তালিকা → ফিডে পাঠানোর মতো পূর্ণ post (আপনার getPosts-এর মতোই গঠন)
export async function hydrateFeedPosts({ ids, userId, blockedIds }) {
  if (!ids.length) return [];

  const blockedSet = new Set(blockedIds.map(String));
  const hidden = FEED_CONFIG.hiddenStatuses;

  const raw = await Post.find({
    _id: { $in: ids },
    moderationStatus: { $nin: hidden },
  })
    .populate("userid", USER_FIELDS)
    .populate({
      path: "content.parentPost",
      strictPopulate: false,
      populate: { path: "userid", select: USER_FIELDS },
    })
    .lean();

  // session-এর ক্রম ঠিক রাখা
  const order = new Map(ids.map((id, i) => [String(id), i]));
  raw.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id)));

  const posts = raw.filter((p) => {
    // লেখক মুছে গেছে বা block সম্পর্কে আছে
    if (!p.userid || blockedSet.has(String(p.userid._id))) return false;

    // share post-এর আসল post হারিয়ে গেছে, লুকানো বা blocked লেখকের
    if (p.content?.type === "share") {
      const parent = p.content.parentPost;
      if (
        !parent ||
        hidden.includes(parent.moderationStatus) ||
        !parent.userid ||
        blockedSet.has(String(parent.userid._id))
      ) {
        return false;
      }
    }
    return true;
  });

  // ── Reaction ──
  let reactedSet = new Set();
  if (userId && posts.length > 0) {
    const reactions = await Reaction.find({
      userId,
      postId: { $in: posts.map((p) => p._id) },
    })
      .select("postId")
      .lean();
    reactedSet = new Set(reactions.map((r) => r.postId.toString()));
  }

  // ── Follow অবস্থা ──
  let followingSet = new Set();
  if (userId && posts.length > 0) {
    const authorIds = new Set();
    posts.forEach((post) => {
      authorIds.add(post.userid._id.toString());
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

  // ── মিলিয়ে ফেলা ──
  let finalPosts = posts.map((post) => {
    const merged = {
      ...post,
      isReacted: reactedSet.has(post._id.toString()),
      userid: {
        ...post.userid,
        isFollowing: followingSet.has(post.userid._id.toString()),
      },
    };
    delete merged.moderationHistory;

    const parent = merged.content?.parentPost;
    if (parent?.userid) {
      merged.content = {
        ...merged.content,
        parentPost: {
          ...parent,
          userid: {
            ...parent.userid,
            isFollowing: followingSet.has(parent.userid._id.toString()),
          },
        },
      };
    }
    return merged;
  });

  // ── question post-এর preview answer ──
  finalPosts = await attachAnswerPreviews(finalPosts, blockedIds);

  return finalPosts;
}
