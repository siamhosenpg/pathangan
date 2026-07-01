import Chapter from "../../models/chapterModel.js";
import Handout from "../../models/handoutModel.js";
import { countWords, calcReadTime } from "../../utils/slugify.js";

// ── Chapter যোগ করা ──
export const addChapter = async (req, res) => {
  try {
    const { handoutId, title, content } = req.body;

    if (!handoutId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "handoutId, title ও content আবশ্যক",
      });
    }

    const handout = await Handout.findOne({ _id: handoutId, isDeleted: false });
    if (!handout) {
      return res
        .status(404)
        .json({ success: false, message: "Handout পাওয়া যায়নি" });
    }
    if (handout.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "অনুমতি নেই" });
    }

    const wordCount = countWords(content);

    const chapter = await Chapter.create({
      handout: handoutId,
      user: req.user.id,
      title,
      content,
      order: handout.chaptersCount, // পরবর্তী ক্রম
      wordCount,
    });

    // handout এর ডিনরমালাইজড কাউন্টার আপডেট
    const newWordCount = handout.wordCount + wordCount;
    await Handout.updateOne(
      { _id: handoutId },
      {
        $inc: { chaptersCount: 1 },
        $set: {
          wordCount: newWordCount,
          estimatedReadTime: calcReadTime(newWordCount),
        },
      },
    );

    return res.status(201).json({ success: true, data: chapter });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Chapter আপডেট (title/content) ──
export const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const chapter = await Chapter.findOne({ _id: id, isDeleted: false });
    if (!chapter) {
      return res
        .status(404)
        .json({ success: false, message: "Chapter পাওয়া যায়নি" });
    }
    if (chapter.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "অনুমতি নেই" });
    }

    const oldWordCount = chapter.wordCount;

    if (title) chapter.title = title;
    if (content) {
      chapter.content = content;
      chapter.wordCount = countWords(content);
    }
    await chapter.save();

    // wordCount এর পার্থক্য handout এ propagate করা
    const diff = chapter.wordCount - oldWordCount;
    if (diff !== 0) {
      const handout = await Handout.findById(chapter.handout);
      const newWordCount = Math.max(0, handout.wordCount + diff);
      await Handout.updateOne(
        { _id: chapter.handout },
        {
          $set: {
            wordCount: newWordCount,
            estimatedReadTime: calcReadTime(newWordCount),
          },
        },
      );
    }

    return res.status(200).json({ success: true, data: chapter });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Chapter Soft Delete ──
export const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findOne({ _id: id, isDeleted: false });
    if (!chapter) {
      return res
        .status(404)
        .json({ success: false, message: "Chapter পাওয়া যায়নি" });
    }
    if (chapter.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "অনুমতি নেই" });
    }

    chapter.isDeleted = true;
    chapter.deletedAt = new Date();
    await chapter.save();

    const handout = await Handout.findById(chapter.handout);
    const newWordCount = Math.max(0, handout.wordCount - chapter.wordCount);

    await Handout.updateOne(
      { _id: chapter.handout },
      {
        $inc: { chaptersCount: -1 },
        $set: {
          wordCount: newWordCount,
          estimatedReadTime: calcReadTime(newWordCount),
        },
      },
    );

    return res
      .status(200)
      .json({ success: true, message: "Chapter ডিলিট করা হয়েছে" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── একটা Handout এর সব Chapter (order অনুযায়ী) ──
export const getChaptersByHandout = async (req, res) => {
  try {
    const { handoutId } = req.params;

    const chapters = await Chapter.find({
      handout: handoutId,
      isDeleted: false,
    })
      .sort({ order: 1 })
      .lean();

    return res.status(200).json({ success: true, data: chapters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Chapter এর ক্রম (order) পুনরায় সাজানো ──
export const reorderChapters = async (req, res) => {
  try {
    const { handoutId } = req.params;
    const { orderedChapterIds } = req.body; // ["id1", "id2", "id3"]

    if (!Array.isArray(orderedChapterIds) || orderedChapterIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "orderedChapterIds আবশ্যক" });
    }

    const handout = await Handout.findOne({ _id: handoutId, isDeleted: false });
    if (!handout) {
      return res
        .status(404)
        .json({ success: false, message: "Handout পাওয়া যায়নি" });
    }
    if (handout.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "অনুমতি নেই" });
    }

    const bulkOps = orderedChapterIds.map((chapterId, index) => ({
      updateOne: {
        filter: { _id: chapterId, handout: handoutId },
        update: { $set: { order: index } },
      },
    }));

    await Chapter.bulkWrite(bulkOps);

    return res
      .status(200)
      .json({ success: true, message: "ক্রম আপডেট হয়েছে" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
