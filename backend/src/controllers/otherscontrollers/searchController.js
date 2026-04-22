import User from "../../models/usermodel.js";
import Post from "../../models/postmodel.js";

export const globalSearch = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // ===== USER SEARCH =====
    const users = await User.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .select("_id name username userid profileImage");

    // ===== POST SEARCH =====
    const posts = await Post.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .populate("userid", "name username profileImage")
      .select("_id content createdAt");

    res.status(200).json({
      success: true,
      users,
      posts,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};
