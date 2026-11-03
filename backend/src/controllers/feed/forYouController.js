import FeedSession from "../../models/feed/feedSessionModel.js";
import { getBlockedUserIds } from "../../helpers/blockHelper.js";
import { buildFeedSession } from "../../helpers/feed/buildFeedSession.js";
import { hydrateFeedPosts } from "../../helpers/feed/hydrateFeedPosts.js";
import { markPostsSeenInBackground } from "../../helpers/feed/seenPosts.js";
import { FEED_CONFIG } from "../../helpers/feed/feedConfig.js";

// cursor: "<sessionId>.<offset>"
const parseCursor = (cursor) => {
  if (typeof cursor !== "string") return { sessionId: null, offset: 0 };
  const match = cursor.match(/^([a-f0-9]{24})\.(\d{1,6})$/i);
  return match
    ? { sessionId: match[1], offset: parseInt(match[2], 10) }
    : { sessionId: null, offset: 0 };
};

// ===================== GET "FOR YOU" FEED =====================
// GET /feed/for-you?limit=10&cursor=<sessionId.offset>
// cursor ছাড়া = নতুন ফিড (pull-to-refresh), response-এর গঠন getPosts-এর মতোই
export const getForYouFeed = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { defaultPageSize, maxPageSize, size } = FEED_CONFIG.session;

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || defaultPageSize, 1),
      maxPageSize,
    );
    const wantDebug = req.query.debug === "1" && req.user?.role === "admin";

    const { sessionId, offset } = parseCursor(req.query.cursor);

    let session = null;
    let start = 0;
    let debug = null;

    // আগের session আছে কিনা (এবং এই user-এরই কিনা)
    if (sessionId) {
      const found = await FeedSession.findById(sessionId).lean();
      if (found && String(found.userId || "") === String(userId || "")) {
        session = found;
        start = offset;
      }
    }

    // নতুন session লাগবে: প্রথম page, session শেষ, বা মেয়াদ উত্তীর্ণ
    if (!session || start >= session.postIds.length) {
      const previousIds = session?.postIds || [];

      let built = await buildFeedSession({ userId, excludeIds: previousIds });

      // সব post আগেই দেখা হয়ে গেছে আর এটা প্রথম page: ফিড ফাঁকা না রেখে আবার দেখানো
      if (built.session.postIds.length === 0 && !sessionId) {
        built = await buildFeedSession({ userId, ignoreSeen: true });
      }

      session = built.session;
      debug = built.debug;
      start = 0;
    }

    const pageIds = session.postIds.slice(start, start + limit);

    if (pageIds.length === 0) {
      return res.json({
        posts: [],
        nextCursor: null,
        hasMore: false,
        ...(wantDebug && debug ? { debug } : {}),
      });
    }

    const blockedIds = await getBlockedUserIds(userId);
    const posts = await hydrateFeedPosts({
      ids: pageIds,
      userId,
      blockedIds,
    });

    // দেখানো post গুলো আর ফিরে আসবে না
    if (userId) markPostsSeenInBackground(userId, pageIds);

    const nextOffset = start + pageIds.length;
    const sessionFinished = nextOffset >= session.postIds.length;
    // session ছোট মানে প্রার্থী ফুরিয়ে গেছে, ফিডের শেষ
    const candidatesExhausted = session.postIds.length < size;

    const nextCursor =
      sessionFinished && candidatesExhausted
        ? null
        : `${session._id}.${nextOffset}`;

    return res.json({
      posts,
      nextCursor,
      hasMore: !!nextCursor,
      ...(wantDebug && debug ? { debug } : {}),
    });
  } catch (err) {
    console.error("Get for-you feed error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
