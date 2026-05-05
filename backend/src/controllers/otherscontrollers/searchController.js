import User from "../../models/usermodel.js";
import Post from "../../models/postmodel.js";

// প্রতিটা word এর জন্য আলাদা regex বানাও
const buildWordRegexes = (query) => {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => new RegExp(word, "i"));
};

// একটা field এ সব word match করার condition
const allWordsMatchField = (field, regexes) => {
  return regexes.map((regex) => ({ [field]: { $regex: regex } }));
};

export const globalSearch = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const regexes = buildWordRegexes(query);

    // single word হলে আগের মতো simple regex
    const singleRegex = new RegExp(query, "i");

    // ===== USER SEARCH =====
    // user এর ক্ষেত্রে name বা username এ যেকোনো একটা word থাকলেই দেখাবে
    const users = await User.find({
      $or: [
        { name: { $regex: singleRegex } },
        { username: { $regex: singleRegex } },
        // multi-word support
        ...regexes.map((r) => ({ name: { $regex: r } })),
        ...regexes.map((r) => ({ username: { $regex: r } })),
      ],
    })
      .limit(10)
      .select("_id name username profileImage");

    // ===== POST SEARCH =====
    // প্রতিটা searchable field এ সব word আছে কিনা চেক করো
    // যেকোনো একটা field এ সব word থাকলেই post দেখাবে
    const postQuery = {
      $or: [
        // normal post — content.title এ সব word আছে
        { $and: allWordsMatchField("content.title", regexes) },
        // normal post — content.text এ সব word আছে
        { $and: allWordsMatchField("content.text", regexes) },
        // course — course.title এ সব word আছে
        { $and: allWordsMatchField("course.title", regexes) },
        // course — course.description এ সব word আছে
        { $and: allWordsMatchField("course.description", regexes) },
        // question — questionText এ সব word আছে
        { $and: allWordsMatchField("question.questionText", regexes) },
      ],
    };

    const posts = await Post.find(postQuery)
      .limit(10)
      .populate("userid", "name username profileImage")
      .select("_id postType content course question createdAt userid");

    // ===== RELEVANCE SORT =====
    // exact phrase match কে আগে দেখাবে
    const sortedPosts = posts.sort((a, b) => {
      const getText = (post) => {
        if (post.postType === "question")
          return post.question?.questionText || "";
        if (post.postType === "course")
          return `${post.course?.title || ""} ${post.course?.description || ""}`;
        return `${post.content?.title || ""} ${post.content?.text || ""}`;
      };

      const aText = getText(a).toLowerCase();
      const bText = getText(b).toLowerCase();
      const lowerQuery = query.toLowerCase();

      const aExact = aText.includes(lowerQuery);
      const bExact = bText.includes(lowerQuery);

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    res.status(200).json({
      success: true,
      users,
      posts: sortedPosts,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};
