import Answer from "../../models/answer/answerModel.js";
import { checkBadText } from "./badTextFilter.js";
import { categorizePost } from "./categorizePost.js";
import {
  flagEntry,
  isAutoFlagged,
  CATEGORIZE_RETRY_DELAY_MS,
} from "./postModeration.js";

// ===================== মালিকের জন্য বার্তা =====================
const MESSAGES = {
  obscene:
    "আপনার উত্তরের লেখায় অশালীন ভাষা পাওয়া গেছে, তাই এটি আপাতত অন্যদের কাছ থেকে লুকানো হয়েছে। লেখাটি সম্পাদনা করে ঠিক করলে উত্তরটি আবার দেখানো হবে।",
  harmful:
    "আপনার উত্তরের লেখায় ক্ষতিকর বিষয় পাওয়া গেছে, তাই এটি আপাতত অন্যদের কাছ থেকে লুকানো হয়েছে। লেখাটি সম্পাদনা করে ঠিক করলে উত্তরটি আবার দেখানো হবে।",
  obscene_and_harmful:
    "আপনার উত্তরের লেখায় অশালীন ভাষা ও ক্ষতিকর বিষয় পাওয়া গেছে, তাই এটি আপাতত অন্যদের কাছ থেকে লুকানো হয়েছে। লেখাটি সম্পাদনা করে ঠিক করলে উত্তরটি আবার দেখানো হবে।",
  flagged_default:
    "আমাদের কমিউনিটি নীতিমালার কারণে আপনার উত্তরটি আপাতত অন্যদের কাছ থেকে লুকানো হয়েছে। লেখাটি সম্পাদনা করলে উত্তরটি আবার যাচাই করা হবে।",
  reported:
    "আপনার উত্তরটি কমিউনিটি নীতিমালা পর্যালোচনার জন্য সাময়িকভাবে লুকানো হয়েছে। পর্যালোচনা শেষ হলে আপনাকে জানানো হবে।",
};

// auto_hidden না হলে null
export function buildAnswerNotice(answer) {
  if (!answer || answer.moderationStatus !== "auto_hidden") return null;

  // system নিজে (local filter / AI) hide করেছে
  if (isAutoFlagged(answer)) {
    const history = answer.moderationHistory || [];
    const last = history[history.length - 1];
    const flagType = last?.note;

    return {
      type: "flagged",
      flagType: flagType || "unknown",
      message: MESSAGES[flagType] || MESSAGES.flagged_default,
    };
  }

  // report-এর কারণে auto_hidden
  return {
    type: "reported",
    flagType: "reported",
    message: MESSAGES.reported,
  };
}

// document বা lean object দুটোই নেয়, plain object ফেরত দেয়:
// মালিক হলে moderationNotice বসায়, আর সবার response থেকে moderationHistory সরায়
export function withAnswerNotice(answer, isOwner) {
  const obj = answer?.toObject ? answer.toObject() : { ...answer };
  obj.moderationNotice = isOwner ? buildAnswerNotice(obj) : null;
  delete obj.moderationHistory;
  return obj;
}

// ===================== কে কোন answer দেখবে =====================
// auto_hidden answer অন্যরা দেখবে না, মালিক নিজের টা দেখবে
// পুরোনো answer-এ moderationStatus নেই, $ne তে সেগুলো ঠিকই ধরা পড়ে
export function visibleAnswerFilter(viewerId) {
  const notHidden = { moderationStatus: { $ne: "auto_hidden" } };
  if (!viewerId) return notHidden;
  return { $or: [notHidden, { userId: viewerId }] };
}

// ===================== RETRY চিহ্ন =====================
// "৫ মিনিট পরে আবার যাচাই করো" চিহ্ন
export function pendingAnswerCheck() {
  return {
    checkStatus: "retry",
    checkAttempts: 0,
    checkRetryAt: new Date(Date.now() + CATEGORIZE_RETRY_DELAY_MS),
  };
}

// যাচাইয়ের পরে answer-এর text এখনো একই আছে কিনা
async function isAnswerTextCurrent(answerId, text) {
  const fresh = await Answer.findById(answerId).select("text isDeleted").lean();
  if (!fresh || fresh.isDeleted) return false;
  return (fresh.text || "").trim() === String(text).trim();
}

// Gemini-র সফল ফল বসানো। flag করলে auto_hidden
// ফেরত দেয়: বসানো হলে true (এর মধ্যে text বদলে গেলে false)
export async function applyAnswerAnalysis(answerId, analysis, text) {
  if (!(await isAnswerTextCurrent(answerId, text))) return false;

  await Answer.updateOne(
    { _id: answerId },
    { $set: { checkStatus: "done", checkRetryAt: null } },
  );

  if (analysis.flagged) {
    await Answer.updateOne(
      {
        _id: answerId,
        moderationStatus: { $nin: ["auto_hidden", "hidden", "removed"] },
      },
      {
        $set: { moderationStatus: "auto_hidden" },
        $push: {
          moderationHistory: flagEntry("ai_flagged", analysis.flagType),
        },
      },
    );
  }

  return true;
}

// ===================== BACKGROUND CHECK =====================
// save হওয়ার পরে Gemini দিয়ে যাচাই, flag করলে auto_hidden
// Gemini ব্যর্থ হলে retry job ৫ মিনিট পরে আবার চেষ্টা করবে
// response আটকায় না, কখনো throw করে না
export function moderateAnswerInBackground(answerId, text) {
  (async () => {
    try {
      const analysis = await categorizePost(text);

      if (analysis.failed) {
        await Answer.updateOne(
          { _id: answerId },
          { $set: pendingAnswerCheck() },
        );
        return;
      }

      await applyAnswerAnalysis(answerId, analysis, text);
    } catch (err) {
      console.error("Background answer moderation error:", err.message);
    }
  })();
}

// ===================== EDIT-এর moderation =====================
// answer document-এর field বদলায় কিন্তু save করে না, save করবে caller
// ফেরত দেয়: { moderation, runBackground }
export async function applyEditModeration(answer, newText) {
  let moderation = { flagged: false, flagType: "none", message: null };
  let runBackground = false;

  const local = checkBadText(newText);

  if (local.flagged) {
    // ১) Local filter কিছু পেয়েছে: API call ছাড়াই auto_hidden
    moderation = local;
    answer.checkStatus = "done";
    answer.checkRetryAt = null;

    if (answer.moderationStatus === "active" || isAutoFlagged(answer)) {
      answer.moderationStatus = "auto_hidden";
      answer.moderationHistory.push(flagEntry("local_filter", local.flagType));
    }
  } else if (isAutoFlagged(answer)) {
    // ২) আগে system hide করেছিল, এখন text পরিষ্কার:
    //    Gemini দিয়ে যাচাই করে তারপর ফিরিয়ে আনা হবে
    const analysis = await categorizePost(newText);

    const restore = () => {
      answer.moderationStatus = "active";
      answer.moderationHistory.push({
        status: "active",
        changedBy: null,
        changedAt: new Date(),
        reason: "edited_clean",
        note: "auto_restored",
      });
    };

    if (analysis.failed) {
      // যাচাই করা গেল না, তবে local filter পরিষ্কার বলেছে।
      // answer ফিরে আসবে, আর ৫ মিনিট পরে আবার যাচাই হবে
      restore();
      Object.assign(answer, pendingAnswerCheck());
    } else if (analysis.flagged) {
      answer.checkStatus = "done";
      answer.checkRetryAt = null;
      moderation = {
        flagged: true,
        flagType: analysis.flagType,
        message: analysis.message,
      };
    } else {
      answer.checkStatus = "done";
      answer.checkRetryAt = null;
      restore();
    }
  } else {
    // ৩) সাধারণ edit: save-এর পরে background-এ যাচাই
    Object.assign(answer, pendingAnswerCheck());
    runBackground = true;
  }

  return { moderation, runBackground };
}
