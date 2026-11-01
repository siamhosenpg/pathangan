import Answer from "../../models/answer/answerModel.js";
import { checkBadText } from "./badTextFilter.js";
import { categorizePost } from "./categorizePost.js";
import { flagEntry, isAutoFlagged } from "./postModeration.js";

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

// ===================== BACKGROUND CHECK =====================
// save হওয়ার পরে Gemini দিয়ে যাচাই, flag করলে auto_hidden
// response আটকায় না, কখনো throw করে না
export function moderateAnswerInBackground(answerId, text) {
  (async () => {
    try {
      const analysis = await categorizePost(text);
      if (!analysis.flagged) return;

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

    if (answer.moderationStatus === "active" || isAutoFlagged(answer)) {
      answer.moderationStatus = "auto_hidden";
      answer.moderationHistory.push(flagEntry("local_filter", local.flagType));
    }
  } else if (isAutoFlagged(answer)) {
    // ২) আগে system hide করেছিল, এখন text পরিষ্কার:
    //    Gemini দিয়ে যাচাই করে তারপর ফিরিয়ে আনা হবে
    const analysis = await categorizePost(newText);

    if (analysis.flagged) {
      moderation = {
        flagged: true,
        flagType: analysis.flagType,
        message: analysis.message,
      };
    } else {
      answer.moderationStatus = "active";
      answer.moderationHistory.push({
        status: "active",
        changedBy: null,
        changedAt: new Date(),
        reason: "edited_clean",
        note: "auto_restored",
      });
    }
  } else {
    // ৩) সাধারণ edit: save-এর পরে background-এ যাচাই
    runBackground = true;
  }

  return { moderation, runBackground };
}
