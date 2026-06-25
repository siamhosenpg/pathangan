import User from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import Follow from "../models/followModel.js";

// ===================== GET ALL USERS =====================
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      accountStatus: { $nin: ["deleted", "banned", "deactivated"] },
    }).select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ===================== GET SINGLE USER BY USERID =====================
export const getUserById = async (req, res) => {
  try {
    const userid = Number(req.params.userid);
    const user = await User.findOne({
      userid,
      accountStatus: { $nin: ["deleted", "banned", "deactivated"] },
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ===================== GET USER BY USERNAME =====================
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await User.findOne({
      username,
      accountStatus: { $nin: ["deleted", "banned", "deactivated"] },
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ===================== UPDATE USER =====================
export const updateUser = async (req, res) => {
  try {
    const userid = Number(req.params.userid);
    const loggedInUserId = req.user.id;

    const user = await User.findOne({
      userid,
      accountStatus: { $nin: ["deleted"] },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() !== loggedInUserId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own profile" });
    }

    const updateData = {};

    const allowedFields = [
      "name",
      "username",
      "bio",
      "aboutText",
      "gender",
      "location",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    if (req.body.work) {
      try {
        updateData.work = JSON.parse(req.body.work);
      } catch {
        return res.status(400).json({ message: "Invalid work data" });
      }
    }

    if (req.body.educations) {
      try {
        updateData.educations = JSON.parse(req.body.educations);
      } catch {
        return res.status(400).json({ message: "Invalid educations data" });
      }
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(req.body.password, salt);
    }

    if (req.files) {
      if (req.files.profileImage) {
        updateData.profileImage = req.files.profileImage[0].path;
      }
      if (req.files.coverImage) {
        updateData.coverImage = req.files.coverImage[0].path;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid data provided to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true },
    ).select("-password");

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Cannot update user", error: err.message });
  }
};

// ===================== SOFT DELETE USER (owner নিজে) =====================
export const deleteUser = async (req, res) => {
  try {
    const userid = Number(req.params.userid);
    const loggedInUserId = req.user?.id;

    const user = await User.findOne({
      userid,
      accountStatus: { $nin: ["deleted"] },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // শুধু নিজের account delete করতে পারবে
    if (user._id.toString() !== loggedInUserId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own account" });
    }

    await User.findByIdAndUpdate(user._id, {
      accountStatus: "deleted",
      deletedAt: new Date(),
      deletedBy: user._id,
      $push: {
        moderationHistory: {
          status: "deleted",
          changedBy: user._id,
          changedAt: new Date(),
          reason: "user_request",
        },
      },
    });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Cannot delete user", error: err.message });
  }
};

// ===================== SUGGESTED USERS (legacy — usersroute এ ব্যবহার হয়) =====================
export const getSuggestedUsers = async (req, res) => {
  try {
    const loggedUserId = req.user.id;

    if (!loggedUserId) {
      return res.status(401).json({ message: "Login required" });
    }

    const followingList = await Follow.find({
      follower: loggedUserId,
    }).select("following");

    const followingIds = followingList.map((item) => item.following.toString());
    followingIds.push(loggedUserId);

    const suggestions = await User.find({
      _id: { $nin: followingIds },
      accountStatus: {
        $nin: ["deleted", "banned", "deactivated", "suspended"],
      },
    })
      .select("-password")
      .limit(20);

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

export const savePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ message: "Push token required" });
    }

    await User.findByIdAndUpdate(req.user.id, { pushToken });
    res.status(200).json({ message: "Push token saved" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
