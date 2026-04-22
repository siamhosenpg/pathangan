import mongoose from "mongoose";
import Post from "../models/postmodel.js";
import { uploadMedia } from "../utils/uploadToCloudinary.js";

// GET /api/posts?limit=10&cursor=2025-12-29T17:00:00.000Z
export const getPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const query = cursor ? { createdAt: { $lt: cursor } } : {};

    const posts = await Post.find(query)
      // 🔵 Post owner
      .populate("userid", "name username badges profileImage gender")

      // 🔥 Shared post → parent post populate
      .populate({
        path: "content.parentPost",
        populate: {
          path: "userid",
          select: "name username badges profileImage gender",
        },
      })

      .sort({ createdAt: -1 })
      .limit(limit + 1) // extra 1 for hasMore
      .exec();

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop(); // remove extra post

    res.json({
      posts,
      nextCursor: hasMore ? posts[posts.length - 1].createdAt : null,
    });
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Get single post by postid with user info
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findOne({ postid: req.params.postid })
      .populate("userid", "name  username badges bio profileImage gender")
      .exec();

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Get all posts by specific userid
export const getPostsByUserId = async (req, res) => {
  try {
    const userId = req.params.userid;

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const query = { userid: userId };
    if (cursor) {
      query.createdAt = { $lt: cursor };
    }

    const posts = await Post.find(query)
      .populate("userid", "name username bio badges profileImage gender")
      .sort({ createdAt: -1 }) // 🔥 latest first
      .limit(limit + 1) // 🔥 extra 1 for hasMore
      .exec();

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop(); // extra item remove

    return res.status(200).json({
      posts: posts || [],
      count: posts.length || 0,
      nextCursor: hasMore ? posts[posts.length - 1].createdAt : null,
      message: posts.length === 0 ? "No posts found" : undefined,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
// 🟢 Create new post (login user required)

// 🟢 Create new post (login required)
export const createPost = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Login required to create post" });
    }

    const { caption, privacy, location, tags, mentions } = req.body;

    const files = req.files || []; // multer gives array
    let mediaUrls = [];
    let contentType = "text";

    // 🧠 If media exists
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
        return res.status(400).json({
          message: "Only one video is allowed",
        });
      }

      if (audios.length > 1) {
        return res.status(400).json({
          message: "Only one audio is allowed",
        });
      }

      // 🖼 Multiple images
      if (images.length > 0) {
        contentType = "image";
        mediaUrls = await Promise.all(images.map((file) => uploadMedia(file)));
      }

      // 🎥 Single video
      if (videos.length === 1) {
        contentType = "video";
        mediaUrls = [await uploadMedia(videos[0])];
      }

      // 🎵 Single audio
      if (audios.length === 1) {
        contentType = "audio";
        mediaUrls = [await uploadMedia(audios[0])];
      }
    }

    // ✅ Generate random postid (7–8 digit safe)
    const randomPostId = Math.floor(1000000 + Math.random() * 9000000);

    const newPost = await Post.create({
      postid: randomPostId,
      userid: req.user.id,
      content: {
        caption,
        media: mediaUrls,
        type: contentType,
        location,
        tags,
        mentions,
      },
      privacy: privacy || "public",
    });

    await newPost.populate("userid", "name badges username profileImage");

    res.status(201).json({
      success: true,
      post: newPost,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 🟢 Update post by _id
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Owner check
    if (req.user._id.toString() !== post.userid.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts" });
    }

    Object.assign(post, req.body, { updatedAt: new Date() });

    const updatedPost = await post.save();
    await updatedPost.populate("userid", "name badges username profileImage");

    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 🟢 Delete post by _id
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Owner check
    if (req.user.id.toString() !== post.userid.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Get single post by MongoDB _id with user info
export const getPostByMongoId = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(id)
      .populate("userid", "name username badges bio profileImage gender")
      .exec();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error("Get post by _id error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Create share post (caption only)
export const createSharePost = async (req, res) => {
  try {
    // 🔐 Auth check
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const { parentPost, caption, privacy } = req.body;

    // ❌ parentPost missing
    if (!parentPost) {
      return res.status(400).json({
        message: "parentPost is required to share a post",
      });
    }

    // ❌ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(parentPost)) {
      return res.status(400).json({ message: "Invalid parent post id" });
    }

    // 🔍 Check original post exists
    const originalPost = await Post.findById(parentPost);
    if (!originalPost) {
      return res.status(404).json({ message: "Original post not found" });
    }

    // 🚫 Media not allowed in share
    if (req.files && req.files.length > 0) {
      return res.status(400).json({
        message: "Media upload is not allowed for share post",
      });
    }

    // 🆕 Create share post
    const sharePost = await Post.create({
      userid: req.user.id,
      postType: "share",
      content: {
        parentPost: parentPost,
        caption: caption || "",
      },
      privacy: privacy || "public",
    });

    // 🔥 Increase share count (optional but recommended)
    await Post.findByIdAndUpdate(parentPost, {
      $inc: { sharesCount: 1 },
    });

    await sharePost.populate("userid", "name username badges profileImage");

    res.status(201).json({
      success: true,
      post: sharePost,
    });
  } catch (error) {
    console.error("Share post error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🟢 Get total post count by specific userid
export const getPostCountByUserId = async (req, res) => {
  try {
    const userId = req.params.userid;

    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    const count = await Post.countDocuments({ userid: userId });

    return res.status(200).json({
      userid: userId,
      count,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
