import Post from "../../models/postmodel.js";

export const getVideoPosts = async (req, res) => {
  try {
    const limit = Math.max(Number(req.query.limit) || 6, 1);
    const { cursor } = req.query;

    const query = {
      "content.type": "video",
      privacy: "public",
    };

    // cursor থাকলে আগের (older) পোস্ট আনবে
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(query)
      .populate("userid", "name userid badges profileImage gender")
      .sort({ createdAt: -1 })
      .limit(limit + 1); // extra 1 → hasMore detect

    const hasMore = posts.length > limit;

    if (hasMore) posts.pop();

    const nextCursor =
      posts.length > 0 ? posts[posts.length - 1].createdAt : null;

    res.status(200).json({
      posts,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getVideoPostsByUser = async (req, res) => {
  try {
    const { userid } = req.params;
    const limit = Math.max(parseInt(req.query.limit) || 6, 1);
    const { cursor } = req.query;

    const query = {
      userid,
      "content.type": "video",
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const videoPosts = await Post.find(query)
      .populate("userid", "name userid badges profileImage gender")
      .sort({ createdAt: -1 })
      .limit(limit + 1);

    const hasMore = videoPosts.length > limit;
    if (hasMore) videoPosts.pop();

    return res.status(200).json({
      posts: videoPosts,
      nextCursor:
        videoPosts.length > 0
          ? videoPosts[videoPosts.length - 1].createdAt
          : null,
      hasMore,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
