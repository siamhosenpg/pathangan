import User from "../../models/usermodel.js";
import Post from "../../models/postmodel.js";

export const globalSearch = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const regex = new RegExp(query, "i");

    // ===== USER SEARCH =====
    const users = await User.find({
      $or: [{ name: { $regex: regex } }, { username: { $regex: regex } }],
    })
      .limit(10)
      .select("_id name username userid profileImage");

    // ===== POST SEARCH =====
    const posts = await Post.find({
      $or: [
        // normal post — title & text
        { "content.title": { $regex: regex } },
        { "content.text": { $regex: regex } },

        // course post — title & description
        { "course.title": { $regex: regex } },
        { "course.description": { $regex: regex } },

        // question post — questionText
        { "question.questionText": { $regex: regex } },
      ],
    })
      .limit(10)
      .populate("userid", "name username profileImage")
      .select("_id postType content course question createdAt userid");

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
