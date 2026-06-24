import mongoose from "mongoose";
import Post from "../models/postmodel.js";
import Reaction from "../models/reactionModel.js";
import { uploadMedia } from "../utils/uploadToCloudinary.js";

// ===================== GET SINGLE POST BY MONGODB _ID =====================
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findOne({
      _id: id,
      // deleted বা removed post কেউ দেখতে পাবে না
      moderationStatus: { $nin: ["deleted", "removed"] },
    })
      .populate(
        "userid",
        "name username greenmarkVerified bio profileImage gender",
      )
      .populate({
        path: "content.parentPost",
        populate: {
          path: "userid",
          select: "name username greenmarkVerified bio profileImage gender",
        },
      })
      .lean();

    if (!post) return res.status(404).json({ message: "Post not found" });

    // ── Reaction check ────────────────────────────────────
    const userId = req.user?.id || null;
    let isReacted = false;

    if (userId) {
      const reaction = await Reaction.findOne({
        userId,
        postId: post._id,
      }).lean();
      isReacted = !!reaction;
    }

    res.json({ ...post, isReacted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================== CREATE NORMAL POST =====================
export const createPost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const { text, title, privacy, location, tags, mentions } = req.body;
    const files = req.files || [];
    let mediaUrls = [];
    let contentType = "text";
    let videoMeta = null;

    if (files.length > 0) {
      const images = files.filter((f) => f.mimetype.startsWith("image"));
      const videos = files.filter((f) => f.mimetype.startsWith("video"));
      const audios = files.filter((f) => f.mimetype.startsWith("audio"));

      if (images.length > 0 && videos.length > 0) {
        return res.status(400).json({
          message: "You can upload either images or a video, not both",
        });
      }
      if (videos.length > 1) {
        return res.status(400).json({ message: "Only one video is allowed" });
      }
      if (audios.length > 1) {
        return res.status(400).json({ message: "Only one audio is allowed" });
      }

      if (images.length > 0) {
        contentType = "image";
        const results = await Promise.all(images.map((f) => uploadMedia(f)));
        mediaUrls = results.map((r) => r.url);
      }
      if (videos.length === 1) {
        contentType = "video";
        const result = await uploadMedia(videos[0]);
        mediaUrls = [result.url];
        if (result.width && result.height) {
          videoMeta = { width: result.width, height: result.height };
        }
      }
      if (audios.length === 1) {
        contentType = "audio";
        const result = await uploadMedia(audios[0]);
        mediaUrls = [result.url];
      }
    }

    const newPost = await Post.create({
      userid: req.user.id,
      postType: "post",
      content: {
        title: title || "",
        text: text || "",
        media: mediaUrls,
        type: contentType,
        location: location || "",
        tags: tags || [],
        mentions: mentions || [],
        videoMeta,
      },
      privacy: privacy || "public",
    });

    await newPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );
    res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===================== CREATE QUESTION POST =====================
export const createQuestionPost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const { questionText, tags, privacy } = req.body;

    if (!questionText?.trim()) {
      return res.status(400).json({ message: "questionText is required" });
    }

    if (req.files?.length > 0) {
      return res.status(400).json({
        message: "Media upload is not allowed for question post",
      });
    }

    const newPost = await Post.create({
      userid: req.user.id,
      postType: "question",
      question: {
        questionText: questionText.trim(),
        tags: tags || [],
      },
      privacy: privacy || "public",
    });

    await newPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );
    res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===================== CREATE COURSE POST =====================
export const createCoursePost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const { title, description, price, tags, privacy } = req.body;
    const files = req.files || [];

    if (!title?.trim()) {
      return res.status(400).json({ message: "Course title is required" });
    }

    let courseMedia = [];

    if (files.length > 0) {
      const images = files.filter((f) => f.mimetype.startsWith("image"));
      const videos = files.filter((f) => f.mimetype.startsWith("video"));

      if (videos.length > 1) {
        return res.status(400).json({ message: "Only one video is allowed" });
      }

      const imageUploads = await Promise.all(
        images.map(async (file) => {
          const result = await uploadMedia(file);
          return { type: "image", url: result.url };
        }),
      );

      const videoUploads = await Promise.all(
        videos.map(async (file) => {
          const result = await uploadMedia(file);
          return { type: "video", url: result.url };
        }),
      );

      courseMedia = [...imageUploads, ...videoUploads];
    }

    const newPost = await Post.create({
      userid: req.user.id,
      postType: "course",
      course: {
        title: title.trim(),
        description: description?.trim() || "",
        media: courseMedia,
        price: Number(price) || 0,
        tags: tags || [],
      },
      privacy: privacy || "public",
    });

    await newPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );
    res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===================== CREATE SHARE POST =====================
export const createSharePost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const { parentPost, caption, privacy } = req.body;

    if (!parentPost) {
      return res.status(400).json({ message: "parentPost is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(parentPost)) {
      return res.status(400).json({ message: "Invalid parent post id" });
    }

    const originalPost = await Post.findOne({
      _id: parentPost,
      moderationStatus: { $nin: ["deleted", "removed"] },
    });

    if (!originalPost) {
      return res.status(404).json({ message: "Original post not found" });
    }

    if (req.files?.length > 0) {
      return res.status(400).json({
        message: "Media upload is not allowed for share post",
      });
    }

    const sharePost = await Post.create({
      userid: req.user.id,
      postType: "post",
      content: {
        parentPost,
        caption: caption || "",
        type: "share",
      },
      privacy: privacy || "public",
    });

    await Post.findByIdAndUpdate(parentPost, { $inc: { sharesCount: 1 } });
    await sharePost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );

    res.status(201).json({ success: true, post: sharePost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== UPDATE POST =====================
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      moderationStatus: { $nin: ["deleted", "removed"] },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (req.user.id.toString() !== post.userid.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts" });
    }

    if (post.postType === "post" && req.body.content) {
      Object.assign(post.content, req.body.content);
    }
    if (post.postType === "question" && req.body.question) {
      Object.assign(post.question, req.body.question);
    }
    if (post.postType === "course" && req.body.course) {
      Object.assign(post.course, req.body.course);
    }

    if (req.body.privacy) post.privacy = req.body.privacy;

    const updatedPost = await post.save();
    await updatedPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );

    res.json({ success: true, post: updatedPost });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ===================== SOFT DELETE POST =====================
export const deletePost = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) return res.status(401).json({ message: "Login required" });

    const post = await Post.findOne({
      _id: req.params.id,
      moderationStatus: { $nin: ["deleted"] },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    const isOwner = post.userid.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    const reason = isAdmin && !isOwner ? "admin_removed" : "user_request";

    await Post.findByIdAndUpdate(req.params.id, {
      moderationStatus: "deleted",
      deletedAt: new Date(),
      deletedBy: userId,
      $push: {
        moderationHistory: {
          status: "deleted",
          changedBy: userId,
          changedAt: new Date(),
          reason,
        },
      },
    });

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================== GET POST COUNT BY USERID =====================
export const getPostCountByUserId = async (req, res) => {
  try {
    const { userid } = req.params;

    if (!userid) {
      return res.status(400).json({ message: "UserId is required" });
    }

    // deleted/removed post count এ ধরা হবে না
    const count = await Post.countDocuments({
      userid,
      moderationStatus: { $nin: ["deleted", "removed"] },
    });

    return res.status(200).json({ userid, count });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
