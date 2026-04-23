import mongoose from "mongoose";
import Post from "../models/postmodel.js";
import { uploadMedia } from "../utils/uploadToCloudinary.js";

// ===================== GET ALL POSTS (cursor-based) =====================
export const getPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
    const query = cursor ? { createdAt: { $lt: cursor } } : {};

    const posts = await Post.find(query)
      .populate("userid", "name username badges profileImage gender")
      .populate({
        path: "content.parentPost",
        populate: {
          path: "userid",
          select: "name username badges profileImage gender",
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    res.json({
      posts,
      nextCursor: hasMore ? posts[posts.length - 1].createdAt : null,
    });
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ===================== GET SINGLE POST BY MONGODB _ID =====================
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(id)
      .populate("userid", "name username badges bio profileImage gender")
      .populate({
        path: "content.parentPost",
        populate: {
          path: "userid",
          select: "name username badges profileImage gender",
        },
      })
      .exec();

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================== GET POSTS BY USERID =====================
export const getPostsByUserId = async (req, res) => {
  try {
    const userId = req.params.userid;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
    const postType = req.query.postType || null; // filter by postType optional

    const query = { userid: userId };
    if (cursor) query.createdAt = { $lt: cursor };
    if (postType) query.postType = postType;

    const posts = await Post.find(query)
      .populate("userid", "name username bio badges profileImage gender")
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    return res.status(200).json({
      posts: posts || [],
      count: posts.length || 0,
      nextCursor: hasMore ? posts[posts.length - 1].createdAt : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
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
        mediaUrls = await Promise.all(images.map((f) => uploadMedia(f)));
      }
      if (videos.length === 1) {
        contentType = "video";
        mediaUrls = [await uploadMedia(videos[0])];
      }
      if (audios.length === 1) {
        contentType = "audio";
        mediaUrls = [await uploadMedia(audios[0])];
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
      },
      privacy: privacy || "public",
    });

    await newPost.populate("userid", "name badges username profileImage");
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

    // Question post এ media নেই
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

    await newPost.populate("userid", "name badges username profileImage");
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
          const url = await uploadMedia(file);
          return { type: "image", url };
        }),
      );

      const videoUploads = await Promise.all(
        videos.map(async (file) => {
          const url = await uploadMedia(file);
          return { type: "video", url };
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

    await newPost.populate("userid", "name badges username profileImage");
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

    const originalPost = await Post.findById(parentPost);
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
    await sharePost.populate("userid", "name username badges profileImage");

    res.status(201).json({ success: true, post: sharePost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== UPDATE POST =====================
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (req.user.id.toString() !== post.userid.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts" });
    }

    // postType অনুযায়ী update
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
    await updatedPost.populate("userid", "name badges username profileImage");

    res.json({ success: true, post: updatedPost });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ===================== DELETE POST =====================
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

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

// ===================== GET POST COUNT BY USERID =====================
export const getPostCountByUserId = async (req, res) => {
  try {
    const { userid } = req.params;

    if (!userid) {
      return res.status(400).json({ message: "UserId is required" });
    }

    const count = await Post.countDocuments({ userid });
    return res.status(200).json({ userid, count });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
