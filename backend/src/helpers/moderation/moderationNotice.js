import { isAutoFlagged } from "./postModeration.js";

const MESSAGES = {
  obscene:
    "আপনার পোস্টের লেখায় অশালীন ভাষা পাওয়া গেছে, তাই এটি আপাতত অন্যদের কাছ থেকে লুকানো হয়েছে। লেখাটি সম্পাদনা করে ঠিক করলে পোস্টটি আবার দেখানো হবে।",
  harmful:
    "আপনার পোস্টের লেখায় ক্ষতিকর বিষয় পাওয়া গেছে, তাই এটি আপাতত অন্যদের কাছ থেকে লুকানো হয়েছে। লেখাটি সম্পাদনা করে ঠিক করলে পোস্টটি আবার দেখানো হবে।",
  obscene_and_harmful:
    "আপনার পোস্টের লেখায় অশালীন ভাষা ও ক্ষতিকর বিষয় পাওয়া গেছে, তাই এটি আপাতত অন্যদের কাছ থেকে লুকানো হয়েছে। লেখাটি সম্পাদনা করে ঠিক করলে পোস্টটি আবার দেখানো হবে।",
  flagged_default:
    "আমাদের কমিউনিটি নীতিমালার কারণে আপনার পোস্টটি আপাতত অন্যদের কাছ থেকে লুকানো হয়েছে। লেখাটি সম্পাদনা করলে পোস্টটি আবার যাচাই করা হবে।",
  reported:
    "আপনার পোস্টটি কমিউনিটি নীতিমালা পর্যালোচনার জন্য সাময়িকভাবে লুকানো হয়েছে। পর্যালোচনা শেষ হলে আপনাকে জানানো হবে।",
};

// auto_hidden না হলে null ফেরত দেয়
// lean object এবং mongoose document দুটোতেই কাজ করে
export function buildModerationNotice(post) {
  if (!post || post.moderationStatus !== "auto_hidden") return null;

  // system নিজে (local filter / AI) hide করেছে
  if (isAutoFlagged(post)) {
    const history = post.moderationHistory || [];
    const last = history[history.length - 1];
    const flagType = last?.note;

    return {
      type: "flagged",
      flagType: flagType || "unknown",
      message: MESSAGES[flagType] || MESSAGES.flagged_default,
    };
  }

  // report-এর কারণে auto_hidden হয়েছে
  return {
    type: "reported",
    flagType: "reported",
    message: MESSAGES.reported,
  };
}

// profile-এর post list-এর জন্য: মালিক হলে প্রতিটা post-এ notice বসায়,
// আর moderationHistory সরিয়ে দেয় (শুধু lean object-এর জন্য)
export function attachModerationNotice(post, isOwner) {
  const moderationNotice = isOwner ? buildModerationNotice(post) : null;
  const { moderationHistory, ...rest } = post;
  return { ...rest, moderationNotice };
}
