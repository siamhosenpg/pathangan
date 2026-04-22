import Post from "../../models/postmodel.js";

/**
 * 🟢 Get all IMAGE or VIDEO posts (Mixed Feed) with Infinite Scroll
 * GET /api/posts/media?skip=0&limit=8
 */
export const getMediaPosts = async (req, res) => {
  try {
    // ক্লায়েন্ট থেকে skip এবং limit নাও, default: skip=0, limit=8
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 8;

    const posts = await Post.find({
      privacy: "public",
      "content.type": { $in: ["image", "video"] },
    })
      .populate("userid", "name userid profileImage")
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .exec();

    // চেক করো আর পোস্ট আছে কিনা
    const totalPosts = await Post.countDocuments({
      privacy: "public",
      "content.type": { $in: ["image", "video"] },
    });

    return res.status(200).json({
      success: true,
      posts: posts || [],
      count: posts.length,
      total: totalPosts,
      nextSkip: skip + posts.length < totalPosts ? skip + posts.length : null,
      message: posts.length === 0 ? "No more media posts" : undefined,
    });
  } catch (error) {
    console.error("getMediaPosts error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * 🟢 Get IMAGE or VIDEO posts by specific user
 * GET /api/posts/media/:userid
 */
export const getMediaPostsByUser = async (req, res) => {
  try {
    const { userid } = req.params;

    const posts = await Post.find({
      userid,
      privacy: "public",
      "content.type": { $in: ["image", "video"] },
    })
      .populate("userid", "name userid profileImage")
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({
      success: true,
      posts: posts || [],
      count: posts.length,
      message: posts.length === 0 ? "No media posts found" : undefined,
    });
  } catch (error) {
    console.error("getMediaPostsByUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
