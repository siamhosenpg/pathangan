import mongoose from "mongoose";
import Post from "../models/postmodel.js";
import Reaction from "../models/reactionModel.js";
import { uploadMedia } from "../utils/uploadToCloudinary.js";
import { getBlockedUserIds } from "../helpers/blockHelper.js";
import { checkBadText } from "../helpers/moderation/badTextFilter.js";
import { buildModerationNotice } from "../helpers/moderation/moderationNotice.js";
import { trackInterestInBackground } from "../helpers/feed/trackInterest.js";
import {
  DEFAULT_CATEGORIES,
  categorizePost,
  categorizeInBackground,
  getTextForAnalysis,
  isAutoFlagged,
  flagEntry,
  pendingCategorization,
} from "../helpers/moderation/postModeration.js";
// ===================== GET SINGLE POST BY MONGODB _ID =====================
// ===================== GET SINGLE POST BY MONGODB _ID =====================
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findOne({
      _id: id,
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

    const userId = req.user?.id || null;
    const isAdmin = req.user?.role === "admin";

    const authorId = post.userid?._id?.toString();
    const isOwner = !!userId && authorId === userId.toString();

    // ── auto_hidden: শুধু মালিক বা admin দেখতে পারবে ──
    if (post.moderationStatus === "auto_hidden" && !isOwner && !isAdmin) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ── Hidden check: blocked + ডিলিট হওয়া ইউজার (login না থাকলেও চেক হবে) ──
    const blockedIds = await getBlockedUserIds(userId);
    const blockedSet = new Set(blockedIds.map((b) => b.toString()));

    const parentAuthorId = post.content?.parentPost?.userid?._id?.toString();

    if (
      (authorId && blockedSet.has(authorId)) ||
      (parentAuthorId && blockedSet.has(parentAuthorId))
    ) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ── Share post-এর আসল post hidden/deleted হলে তার লেখা দেখানো হবে না ──
    const parent = post.content?.parentPost;
    if (
      parent &&
      ["auto_hidden", "deleted", "removed"].includes(parent.moderationStatus)
    ) {
      const isParentOwner = !!userId && parentAuthorId === userId.toString();
      if (!isParentOwner && !isAdmin) {
        post.content.parentPost = null;
      }
    }

    // ── Reaction check ────────────────────────────────────
    let isReacted = false;

    if (userId) {
      const reaction = await Reaction.findOne({
        userId,
        postId: post._id,
      }).lean();
      isReacted = !!reaction;
    }

    // ── মালিক হলে moderation বার্তা ──
    const moderationNotice = isOwner ? buildModerationNotice(post) : null;

    // moderationHistory শুধু admin দেখতে পাবে
    if (!isAdmin) delete post.moderationHistory;

    res.json({ ...post, isReacted, moderationNotice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================== CREATE NORMAL POST =====================
// ===================== CREATE NORMAL POST =====================

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
        const results = await Promise.all(
          images.map((f) =>
            uploadMedia(f, {
              baseFolder: "posts",
              username: req.user.username,
            }),
          ),
        );
        mediaUrls = results.map((r) => r.url);
      }
      if (videos.length === 1) {
        contentType = "video";
        const result = await uploadMedia(videos[0], {
          baseFolder: "posts",
          username: req.user.username,
        });
        mediaUrls = [result.url];
        if (result.width && result.height) {
          videoMeta = { width: result.width, height: result.height };
        }
      }
      if (audios.length === 1) {
        contentType = "audio";
        const result = await uploadMedia(audios[0], {
          baseFolder: "posts",
          username: req.user.username,
        });
        mediaUrls = [result.url];
      }
    }

    // ── ধাপ ১: Local filter (API call ছাড়া, তাৎক্ষণিক) ──
    // title আর text একসাথে যাচাই হবে
    const textForAnalysis = [title, text]
      .filter((t) => typeof t === "string" && t.trim())
      .join("\n");

    const local = checkBadText(textForAnalysis);

    // text আছে আর local filter পরিষ্কার: Gemini দিয়ে category বের হবে
    const shouldCategorize = !local.flagged && !!textForAnalysis;

    const postData = {
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
      // category বের হওয়ার অপেক্ষায় থাকলে [], আর text না থাকলে (বা আগেই flagged) default
      categories: shouldCategorize ? [] : [...DEFAULT_CATEGORIES],
      // Gemini ব্যর্থ হলে বা server বন্ধ হলে ৫ মিনিট পরে job আবার চেষ্টা করবে
      ...(shouldCategorize ? pendingCategorization() : {}),
      privacy: privacy || "public",
    };

    // Local filter কিছু পেলে সরাসরি auto_hidden, Gemini call হবে না
    if (local.flagged) {
      postData.moderationStatus = "auto_hidden";
      postData.moderationHistory = [flagEntry("local_filter", local.flagType)];
    }

    // ── ধাপ ২: আগে post save ──
    const newPost = await Post.create(postData);

    await newPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );

    // ── ধাপ ৩: save-এর পরে background-এ Gemini দিয়ে category ──
    if (shouldCategorize) {
      categorizeInBackground(newPost._id, textForAnalysis);
    }

    res.status(201).json({
      success: true,
      post: newPost,
      moderation: {
        flagged: local.flagged,
        flagType: local.flagType,
        message: local.message,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
// ===================== CREATE QUESTION POST =====================
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

    const cleanQuestion = questionText.trim();

    // ── ধাপ ১: Local filter (API call ছাড়া, তাৎক্ষণিক) ──
    const local = checkBadText(cleanQuestion);

    const shouldCategorize = !local.flagged;

    const postData = {
      userid: req.user.id,
      postType: "question",
      question: {
        questionText: cleanQuestion,
        tags: tags || [],
      },
      // category বের হওয়ার অপেক্ষায় থাকলে [], আগেই flagged হলে default
      categories: shouldCategorize ? [] : [...DEFAULT_CATEGORIES],
      // Gemini ব্যর্থ হলে বা server বন্ধ হলে ৫ মিনিট পরে job আবার চেষ্টা করবে
      ...(shouldCategorize ? pendingCategorization() : {}),
      privacy: privacy || "public",
    };

    // Local filter কিছু পেলে সরাসরি auto_hidden, Gemini call হবে না
    if (local.flagged) {
      postData.moderationStatus = "auto_hidden";
      postData.moderationHistory = [flagEntry("local_filter", local.flagType)];
    }

    // ── ধাপ ২: আগে post save ──
    const newPost = await Post.create(postData);

    await newPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );

    // ── ধাপ ৩: save-এর পরে background-এ Gemini দিয়ে category ──
    if (shouldCategorize) {
      categorizeInBackground(newPost._id, cleanQuestion);
    }

    res.status(201).json({
      success: true,
      post: newPost,
      moderation: {
        flagged: local.flagged,
        flagType: local.flagType,
        message: local.message,
      },
    });
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
          const result = await uploadMedia(file, {
            baseFolder: "courses",
            username: req.user.username,
          });
          return { type: "image", url: result.url };
        }),
      );

      const videoUploads = await Promise.all(
        videos.map(async (file) => {
          const result = await uploadMedia(file, {
            baseFolder: "courses",
            username: req.user.username,
          });
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

    // block থাকলে share করা যাবে না
    const blockedIds = await getBlockedUserIds(req.user.id);
    const isBlocked = blockedIds.some(
      (b) => b.toString() === originalPost.userid.toString(),
    );
    if (isBlocked) {
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

    // 🎯 আগ্রহ জমানো: আসল post-এর বিষয়ে (background)
    trackInterestInBackground(req.user.id, parentPost, "share");

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

    // edit-এর আগের text মনে রাখা, পরে তুলনা করার জন্য
    const oldText = getTextForAnalysis(post);

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

    // ── Moderation: শুধু text বদলালে চেক (title + text একসাথে) ──
    const newText = getTextForAnalysis(post);
    const textChanged = newText !== oldText;

    let moderation = { flagged: false, flagType: "none", message: null };
    let runBackground = false;

    if (textChanged) {
      const local = checkBadText(newText);

      if (local.flagged) {
        // ১) Local filter কিছু পেয়েছে: API call ছাড়াই auto_hidden
        moderation = local;
        post.categories = [...DEFAULT_CATEGORIES];
        post.categorizationStatus = "done";
        post.categorizeRetryAt = null;

        if (
          ["active", "under_review"].includes(post.moderationStatus) ||
          isAutoFlagged(post)
        ) {
          post.moderationStatus = "auto_hidden";
          post.moderationHistory.push(
            flagEntry("local_filter", local.flagType),
          );
        }
      } else if (isAutoFlagged(post)) {
        // ২) আগে system hide করেছিল, এখন text পরিষ্কার:
        //    Gemini দিয়ে যাচাই করে তারপর ফিরিয়ে আনা হবে
        const analysis = await categorizePost(newText);

        const restore = () => {
          post.moderationStatus = "active";
          post.moderationHistory.push({
            status: "active",
            changedBy: null,
            changedAt: new Date(),
            reason: "edited_clean",
            note: "auto_restored",
          });
        };

        if (analysis.failed) {
          // যাচাই করা গেল না, তবে local filter পরিষ্কার বলেছে।
          // post ফিরে আসবে, আর ৫ মিনিট পরে আবার যাচাই হবে
          // (তখন খারাপ কিছু পেলে আবার auto_hidden হবে)
          restore();
          Object.assign(post, pendingCategorization());
        } else {
          post.categories = analysis.categories;
          post.categorizationStatus = "done";
          post.categorizeRetryAt = null;

          if (analysis.flagged) {
            moderation = {
              flagged: true,
              flagType: analysis.flagType,
              message: analysis.message,
            };
          } else {
            restore();
          }
        }
      } else if (newText) {
        // ৩) সাধারণ edit: save-এর পরে background-এ category update
        //    (পুরোনো category নতুন ফল আসা পর্যন্ত থাকবে)
        Object.assign(post, pendingCategorization());
        runBackground = true;
      } else {
        // ৪) সব text মুছে ফেলা হয়েছে
        post.categories = [...DEFAULT_CATEGORIES];
        post.categorizationStatus = "done";
        post.categorizeRetryAt = null;
      }
    }

    const updatedPost = await post.save();
    await updatedPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );

    if (runBackground) {
      categorizeInBackground(updatedPost._id, newText);
    }

    res.json({ success: true, post: updatedPost, moderation });
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
// ===================== GET POST COUNT BY USERID =====================
export const getPostCountByUserId = async (req, res) => {
  try {
    const { userid } = req.params;

    if (!userid) {
      return res.status(400).json({ message: "UserId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const viewerId = req.user?.id || null;
    const isOwner = !!viewerId && viewerId.toString() === userid.toString();

    // deleted/removed কখনো গোনা হবে না
    // auto_hidden শুধু মালিক নিজের count-এ দেখবে
    const count = await Post.countDocuments({
      userid,
      moderationStatus: {
        $nin: isOwner
          ? ["deleted", "removed"]
          : ["deleted", "removed", "auto_hidden"],
      },
    });

    return res.status(200).json({ userid, count });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
