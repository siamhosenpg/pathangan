import Handout from "../../models/handoutModel.js";
import Chapter from "../../models/chapterModel.js";
import { generateSlug } from "../../utils/slugify.js";

// ── Handout তৈরি (draft হিসেবে শুরু হবে) ──
export const createHandout = async (req, res) => {
  try {
    const { title, description, coverImage, category, tags } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "title, description ও category আবশ্যক",
      });
    }

    const slug = generateSlug(title);

    const handout = await Handout.create({
      user: req.user.id,
      title,
      slug,
      description,
      coverImage: coverImage || null,
      category,
      tags: Array.isArray(tags) ? tags : [],
      status: "draft",
    });

    return res.status(201).json({ success: true, data: handout });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Handout তথ্য আপডেট (শুধু owner) ──
export const updateHandout = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, coverImage, category, tags } = req.body;

    const handout = await Handout.findOne({ _id: id, isDeleted: false });
    if (!handout) {
      return res
        .status(404)
        .json({ success: false, message: "Handout পাওয়া যায়নি" });
    }

    if (handout.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "অনুমতি নেই" });
    }

    if (title) {
      handout.title = title;
      // slug শুধু draft অবস্থায় বদলাবে, published হলে URL ভাঙবে না
      if (handout.status === "draft") {
        handout.slug = generateSlug(title);
      }
    }
    if (description) handout.description = description;
    if (coverImage !== undefined) handout.coverImage = coverImage;
    if (category) handout.category = category;
    if (Array.isArray(tags)) handout.tags = tags;

    await handout.save();

    return res.status(200).json({ success: true, data: handout });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Publish করা (draft → published, কমপক্ষে ১টা chapter থাকতে হবে) ──
export const publishHandout = async (req, res) => {
  try {
    const { id } = req.params;

    const handout = await Handout.findOne({ _id: id, isDeleted: false });
    if (!handout) {
      return res
        .status(404)
        .json({ success: false, message: "Handout পাওয়া যায়নি" });
    }
    if (handout.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "অনুমতি নেই" });
    }
    if (handout.chaptersCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Publish করার আগে অন্তত ১টি chapter যোগ করুন",
      });
    }

    handout.status = "published";
    handout.publishedAt = new Date();
    await handout.save();

    return res.status(200).json({ success: true, data: handout });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Feed: সব published handout, cursor pagination + category filter ──

// ── Feed: সব published handout, cursor pagination + category filter ──
export const getHandouts = async (req, res) => {
  try {
    const { cursor, limit = 10, category, search } = req.query;
    const pageLimit = Math.min(Number(limit), 30);

    const filter = { isDeleted: false, status: "published" };
    if (category) filter.category = category;

    // ✅ cursor থাকলে এবং সেটা valid ObjectId হলেই filter এ যোগ হবে
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: cursor };
    }

    if (search) filter.$text = { $search: search };

    const handouts = await Handout.find(filter)
      .sort({ _id: -1 })
      .limit(pageLimit + 1)
      .populate("user", "username fullName avatar")
      .lean();

    const hasMore = handouts.length > pageLimit;
    const data = hasMore ? handouts.slice(0, pageLimit) : handouts;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    return res.status(200).json({ success: true, data, nextCursor, hasMore });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── নিজের সব handout (draft + published) ──
export const getMyHandouts = async (req, res) => {
  try {
    const { cursor, limit = 10, status } = req.query;
    const pageLimit = Math.min(Number(limit), 30);

    const filter = { isDeleted: false, user: req.user.id };
    if (status) filter.status = status;

    // ✅ একই গার্ড এখানেও
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: cursor };
    }

    const handouts = await Handout.find(filter)
      .sort({ _id: -1 })
      .limit(pageLimit + 1)
      .lean();

    const hasMore = handouts.length > pageLimit;
    const data = hasMore ? handouts.slice(0, pageLimit) : handouts;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    return res.status(200).json({ success: true, data, nextCursor, hasMore });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── slug দিয়ে একটা handout + তার chapters (TOC) দেখা ──
export const getHandoutBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const handout = await Handout.findOne({ slug, isDeleted: false })
      .populate("user", "username fullName avatar")
      .lean();

    if (!handout) {
      return res
        .status(404)
        .json({ success: false, message: "Handout পাওয়া যায়নি" });
    }

    // owner না হলে draft দেখতে পারবে না
    const isOwner = req.user && req.user.id === handout.user._id.toString();
    if (handout.status !== "published" && !isOwner) {
      return res
        .status(404)
        .json({ success: false, message: "Handout পাওয়া যায়নি" });
    }

    const chapters = await Chapter.find({
      handout: handout._id,
      isDeleted: false,
    })
      .sort({ order: 1 })
      .select("title order wordCount")
      .lean();

    // published handout view count বাড়বে (owner এর নিজের view count হবে না)
    if (handout.status === "published" && !isOwner) {
      await Handout.updateOne({ _id: handout._id }, { $inc: { readCount: 1 } });
    }

    return res
      .status(200)
      .json({ success: true, data: { ...handout, chapters } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Soft Delete ──
export const softDeleteHandout = async (req, res) => {
  try {
    const { id } = req.params;

    const handout = await Handout.findOne({ _id: id, isDeleted: false });
    if (!handout) {
      return res
        .status(404)
        .json({ success: false, message: "Handout পাওয়া যায়নি" });
    }
    if (handout.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "অনুমতি নেই" });
    }

    handout.isDeleted = true;
    handout.deletedAt = new Date();
    handout.deletedBy = req.user.id;
    await handout.save();

    // handout এর সাথে চ্যাপ্টারগুলোও soft delete হবে
    await Chapter.updateMany(
      { handout: handout._id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
    );

    return res
      .status(200)
      .json({ success: true, message: "Handout ডিলিট করা হয়েছে" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Restore (admin/owner) ──
export const restoreHandout = async (req, res) => {
  try {
    const { id } = req.params;

    const handout = await Handout.findOne({ _id: id, isDeleted: true });
    if (!handout) {
      return res
        .status(404)
        .json({ success: false, message: "Handout পাওয়া যায়নি" });
    }
    if (handout.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "অনুমতি নেই" });
    }

    handout.isDeleted = false;
    handout.deletedAt = null;
    handout.deletedBy = null;
    await handout.save();

    await Chapter.updateMany(
      { handout: handout._id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
    );

    return res.status(200).json({ success: true, data: handout });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
