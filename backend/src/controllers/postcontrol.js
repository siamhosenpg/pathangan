import mongoose from "mongoose";
import Post from "../models/postmodel.js";
import Reaction from "../models/reactionModel.js";
import { uploadMedia } from "../utils/uploadToCloudinary.js";
import { getBlockedUserIds } from "../helpers/blockHelper.js";
import { checkBadText } from "../helpers/moderation/badTextFilter.js";
import { buildModerationNotice } from "../helpers/moderation/moderationNotice.js";
import {
  DEFAULT_CATEGORIES,
  categorizePost,
  categorizeInBackground,
  getTextForAnalysis,
  getLocalCheckText,
  isAutoFlagged,
  flagEntry,
  pendingCategorization,
} from "../helpers/moderation/postModeration.js";

// ===================== ছোট helper =====================
const ALLOWED_PRIVACY = ["public", "private"];

const cleanPrivacy = (p) => (ALLOWED_PRIVACY.includes(p) ? p : "public");

const str = (v) => (typeof v === "string" ? v.trim() : "");

const cleanList = (value) => {
  const arr = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
      ? [value]
      : [];
  return arr
    .filter((t) => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
};

// নতুন post বানানোর সময় moderation-এর অংশ একই নিয়মে তৈরি
// draft: { postType, content | question | course } (শুধু যাচাইয়ের জন্য)
function buildModerationFields(draft) {
  const local = checkBadText(getLocalCheckText(draft));
  const text = getTextForAnalysis(draft);
  const shouldCategorize = !local.flagged && !!text;

  const fields = {
    // category বের হওয়ার অপেক্ষায় থাকলে [], আর text না থাকলে (বা আগেই flagged) default
    categories: shouldCategorize ? [] : [...DEFAULT_CATEGORIES],
    // Gemini ব্যর্থ হলে বা server বন্ধ হলে ৫ মিনিট পরে job আবার চেষ্টা করবে
    ...(shouldCategorize ? pendingCategorization() : {}),
  };

  // Local filter কিছু পেলে সরাসরি auto_hidden, Gemini call হবে না
  if (local.flagged) {
    fields.moderationStatus = "auto_hidden";
    fields.moderationHistory = [flagEntry("local_filter", local.flagType)];
  }

  return { local, shouldCategorize, fields };
}

const moderationResponse = (local) => ({
  flagged: local.flagged,
  flagType: local.flagType,
  message: local.message,
});

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
      .lean();

    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user?.id || null;
    const isAdmin = req.user?.role === "admin";

    const authorId = post.userid?._id?.toString();
    const isOwner = !!userId && authorId === userId.toString();

    // ── auto_hidden / hidden / private: শুধু মালিক বা admin দেখতে পারবে ──
    const restricted =
      ["auto_hidden", "hidden"].includes(post.moderationStatus) ||
      post.privacy !== "public";

    if (restricted && !isOwner && !isAdmin) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ── Block check (login না থাকলেও চেক হবে) ──
    const blockedIds = await getBlockedUserIds(userId);
    const blockedSet = new Set(blockedIds.map((b) => b.toString()));

    if (authorId && blockedSet.has(authorId)) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ── Reaction check ──
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

    // এই তথ্য শুধু admin দেখতে পাবে
    if (!isAdmin) {
      delete post.moderationHistory;
      delete post.reportCount;
    }

    res.json({ ...post, isReacted, moderationNotice });
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

    const content = {
      title: str(title),
      text: str(text),
      media: mediaUrls,
      type: contentType,
      location: str(location),
      tags: cleanList(tags),
      mentions: cleanList(mentions),
      videoMeta,
    };

    // title, text, tags, location, mentions সব local filter-এ যাবে; Gemini-তে শুধু title + text
    const { local, shouldCategorize, fields } = buildModerationFields({
      postType: "post",
      content,
    });

    // ── ধাপ ১: আগে post save ──
    const newPost = await Post.create({
      userid: req.user.id,
      postType: "post",
      content,
      ...fields,
      privacy: cleanPrivacy(privacy),
    });

    await newPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );

    // ── ধাপ ২: save-এর পরে background-এ Gemini দিয়ে category ──
    if (shouldCategorize) categorizeInBackground(newPost._id);

    res.status(201).json({
      success: true,
      post: newPost,
      moderation: moderationResponse(local),
    });
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

    if (!str(questionText)) {
      return res.status(400).json({ message: "questionText is required" });
    }

    if (req.files?.length > 0) {
      return res.status(400).json({
        message: "Media upload is not allowed for question post",
      });
    }

    const question = {
      questionText: str(questionText),
      tags: cleanList(tags),
    };

    const { local, shouldCategorize, fields } = buildModerationFields({
      postType: "question",
      question,
    });

    const newPost = await Post.create({
      userid: req.user.id,
      postType: "question",
      question,
      ...fields,
      privacy: cleanPrivacy(privacy),
    });

    await newPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );

    if (shouldCategorize) categorizeInBackground(newPost._id);

    res.status(201).json({
      success: true,
      post: newPost,
      moderation: moderationResponse(local),
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

    if (!str(title)) {
      return res.status(400).json({ message: "Course title is required" });
    }

    const priceNumber = Number(price);
    if (
      price !== undefined &&
      price !== "" &&
      (!Number.isFinite(priceNumber) || priceNumber < 0)
    ) {
      return res.status(400).json({ message: "Invalid price" });
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

    const course = {
      title: str(title),
      description: str(description),
      media: courseMedia,
      price: Number.isFinite(priceNumber) ? priceNumber : 0,
      tags: cleanList(tags),
    };

    const { local, shouldCategorize, fields } = buildModerationFields({
      postType: "course",
      course,
    });

    const newPost = await Post.create({
      userid: req.user.id,
      postType: "course",
      course,
      ...fields,
      privacy: cleanPrivacy(privacy),
    });

    await newPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );

    if (shouldCategorize) categorizeInBackground(newPost._id);

    res.status(201).json({
      success: true,
      post: newPost,
      moderation: moderationResponse(local),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===================== UPDATE POST =====================
export const updatePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

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

    // edit-এর আগের অবস্থা মনে রাখা, পরে তুলনা করার জন্য
    const oldText = getTextForAnalysis(post);
    const oldLocal = getLocalCheckText(post);

    // ── শুধু অনুমোদিত field বদলানো যাবে (media, type, price ইত্যাদি নয়) ──
    if (post.postType === "post" && req.body.content) {
      const c = req.body.content;
      if (typeof c.title === "string") post.content.title = c.title;
      if (typeof c.text === "string") post.content.text = c.text;
      if (typeof c.location === "string") post.content.location = c.location;
      if (c.tags !== undefined) post.content.tags = cleanList(c.tags);
      if (c.mentions !== undefined)
        post.content.mentions = cleanList(c.mentions);
    }

    if (post.postType === "question" && req.body.question) {
      const q = req.body.question;
      if (q.questionText !== undefined) {
        if (!str(q.questionText)) {
          return res.status(400).json({ message: "questionText is required" });
        }
        post.question.questionText = q.questionText;
      }
      if (q.tags !== undefined) post.question.tags = cleanList(q.tags);
    }

    if (post.postType === "course" && req.body.course) {
      const c = req.body.course;
      if (c.title !== undefined) {
        if (!str(c.title)) {
          return res.status(400).json({ message: "Course title is required" });
        }
        post.course.title = c.title;
      }
      if (typeof c.description === "string")
        post.course.description = c.description;
      if (c.price !== undefined) {
        const p = Number(c.price);
        if (!Number.isFinite(p) || p < 0) {
          return res.status(400).json({ message: "Invalid price" });
        }
        post.course.price = p;
      }
      if (c.tags !== undefined) post.course.tags = cleanList(c.tags);
    }

    if (req.body.privacy !== undefined) {
      if (!ALLOWED_PRIVACY.includes(req.body.privacy)) {
        return res.status(400).json({ message: "Invalid privacy value" });
      }
      post.privacy = req.body.privacy;
    }

    // ── Moderation: text বা tags/location/mentions বদলালে চেক ──
    const newText = getTextForAnalysis(post);
    const newLocal = getLocalCheckText(post);
    const textChanged = newText !== oldText;
    const localChanged = newLocal !== oldLocal;

    let moderation = { flagged: false, flagType: "none", message: null };
    let runBackground = false;

    if (textChanged || localChanged) {
      const local = checkBadText(newLocal);

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
        // ২) আগে system hide করেছিল, এখন লেখা পরিষ্কার:
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
          restore();
          Object.assign(post, pendingCategorization());
          runBackground = true;
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
      } else if (textChanged) {
        if (newText) {
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
    }

    const updatedPost = await post.save();
    await updatedPost.populate(
      "userid",
      "name username greenmarkVerified profileImage",
    );

    if (runBackground) categorizeInBackground(updatedPost._id);

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

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

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

    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const viewerId = req.user?.id || null;
    const isOwner = !!viewerId && viewerId.toString() === userid.toString();

    // মালিক নিজের count-এ private ও auto_hidden দেখবে, অন্যরা শুধু public ও দেখা যায় এমন post
    const query = isOwner
      ? { userid, moderationStatus: { $nin: ["deleted", "removed"] } }
      : {
          userid,
          privacy: "public",
          moderationStatus: {
            $nin: ["deleted", "removed", "auto_hidden", "hidden"],
          },
        };

    const count = await Post.countDocuments(query);

    return res.status(200).json({ userid, count });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
