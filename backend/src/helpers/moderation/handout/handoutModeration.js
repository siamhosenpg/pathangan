import Handout from "../../../models/handoutModel.js";
import Chapter from "../../../models/chapterModel.js";
import { checkTexts } from "../textCheck.js";

const CLEAN = { flagged: false, flagType: "none", message: null };

// handout-এর নিজের text: title, description, tags
export const checkHandoutInfo = (handout) =>
  checkTexts(handout.title, handout.description, handout.tags);

// chapter-এর text: title, content
export const checkChapter = (chapter) =>
  checkTexts(chapter.title, chapter.content);

// handout-এর তথ্য + তার সব chapter একসাথে scan
export async function scanWholeHandout(handoutId) {
  const handout = await Handout.findOne({ _id: handoutId, isDeleted: false })
    .select("title description tags")
    .lean();

  if (!handout) return CLEAN;

  const info = checkHandoutInfo(handout);
  if (info.flagged) return info;

  const chapters = await Chapter.find({
    handout: handoutId,
    isDeleted: false,
  })
    .select("title content")
    .lean();

  for (const ch of chapters) {
    const r = checkChapter(ch);
    if (r.flagged) return { ...r, chapterId: ch._id };
  }

  return CLEAN;
}

// bad text পেলে published handout কে auto_hidden করে (draft / under_review হলে কিছু করে না)
// ফেরত দেয়: বদলানো হলে true
export async function autoHideIfPublished(handoutId) {
  const result = await Handout.updateOne(
    { _id: handoutId, status: "published", isDeleted: false },
    { $set: { status: "auto_hidden" } },
  );
  return result.modifiedCount > 0;
}

// শুধু auto_hidden handout-এর জন্য: পুরো handout আবার scan করে, পরিষ্কার হলে published করে
// under_review (report / manual) কখনো এখানে ফিরে আসবে না
// ফেরত দেয়: ফিরিয়ে আনা হলে true
export async function restoreIfClean(handoutId) {
  const exists = await Handout.exists({
    _id: handoutId,
    status: "auto_hidden",
    isDeleted: false,
  });
  if (!exists) return false;

  const scan = await scanWholeHandout(handoutId);
  if (scan.flagged) return false;

  const result = await Handout.updateOne(
    { _id: handoutId, status: "auto_hidden" },
    { $set: { status: "published" } },
  );
  return result.modifiedCount > 0;
}
