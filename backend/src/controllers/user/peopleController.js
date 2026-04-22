import User from "../../models/usermodel.js";
import Follow from "../../models/followModel.js";

/**
 * 🟦 Suggestion Accounts
 * → Those users whom logged-in user does NOT follow
 * → Exclude logged-in user himself
 */
export const getPeople = async (req, res) => {
  try {
    const loggedUserId = req.user.id; // MongoDB _id (string)

    if (!loggedUserId) {
      return res.status(401).json({ message: "Login required" });
    }

    // 1️⃣ Find all users I already follow
    const followingList = await Follow.find({ follower: loggedUserId }).select(
      "following"
    );

    const followingIds = followingList.map((item) => item.following.toString());

    // 2️⃣ Add my own id (so I am not suggested)
    followingIds.push(loggedUserId);

    // 3️⃣ Fetch all users except my following + myself
    const suggestions = await User.find({
      _id: { $nin: followingIds },
    })
      .select("-password")
      .limit(20); // want only 20 profiles

    res.status(200).json({
      count: suggestions.length,
      users: suggestions,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error while loading suggestions",
      error: err.message,
    });
  }
};
