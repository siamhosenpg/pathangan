const DAY_MS = 24 * 60 * 60 * 1000;
export const DAY = DAY_MS;

export const FEED_CONFIG = {
  // ===== ঘটনার ওজন (আগ্রহ জমানোর জন্য) =====
  eventWeights: {
    view: 1, // ২ সেকেন্ডের বেশি দেখা
    deep_view: 2, // ভিডিওর অর্ধেক বা ১৫ সেকেন্ডের বেশি দেখা
    like: 3,
    comment: 5,
    answer: 5,
    save: 5,
    share: 6,
    onboarding: 6, // user নিজে বাছলে
    not_interested: -8,
  },
  // post-এর ১ম, ২য়, ৩য় category কে কত ভাগ ওজন
  positionFactors: [1, 0.6, 0.4],

  // আগ্রহ কত দিনে অর্ধেক হবে।
  // সাবধান: চালু হওয়ার পরে এটা বদলালে আগে জমা নম্বর অর্থহীন হবে (সবার আগ্রহ রিসেট করতে হবে)
  halfLifeDays: 14,
  epochMs: Date.UTC(2026, 0, 1),

  // দেখার মাপ (Expo থেকে আসা তথ্য)
  viewDwellMs: 2000,
  deepViewDwellMs: 15000,
  deepViewWatchRatio: 0.5,

  // "দেখা post" কত দিন মনে রাখা হবে
  seenTtlDays: 3,
  dismissTtlDays: 90,
  maxSeenIds: 3000,

  // ===== user-এর আগ্রহের প্রোফাইল =====
  profile: {
    topCategories: 4, // সর্বোচ্চ কয়টা আগ্রহ ফিডে কাজে লাগবে
    minInterestScore: 2, // এর নিচের নম্বর আগ্রহ ধরা হবে না
    avoidScore: -4, // এর নিচে নামলে ওই বিষয় এড়ানো হবে
    strengthFullScore: 20, // মোট নম্বর এতে পৌঁছালে "পুরো আগ্রহী" ধরা হবে
    shareSharpness: 1.5, // বেশি আগ্রহের বিষয়কে আরও বেশি ভাগ দেওয়া
  },

  // ===== ফিড session =====
  session: {
    size: 120,
    ttlMinutes: 30,
    defaultPageSize: 10,
    maxPageSize: 20,
  },

  // ===== কোন উৎস থেকে কত ভাগ post =====
  mix: {
    interestMin: 0.35, // আগ্রহের ইতিহাস কম হলে আগ্রহ-ভিত্তিক post-এর ভাগ
    interestMax: 0.75, // আগ্রহ পুরো জমলে
    topCategoryCap: 0.6, // একটা বিষয় কখনো এর বেশি জায়গা পাবে না (১০টার মধ্যে ৬টা)
    following: 0.15,
    trendingOfSpare: 0.4, // বাকি জায়গার ৪০% জনপ্রিয়, ৬০% নতুন বিষয়
    latestFiller: 0.02, // সব ফুরিয়ে গেলে ফিড যেন থেমে না যায়
    coldStart: { following: 0.25, trending: 0.45, explore: 0.3 },
    coldStartNoFollow: { trending: 0.6, explore: 0.4 },
    guest: { trending: 0.6, explore: 0.4 },
  },

  // কত দিনের পুরোনো post পর্যন্ত দেখা হবে
  windows: {
    interestDays: 14,
    followingDays: 7,
    trendingDays: 3,
    exploreDays: 7,
    latestDays: 30,
  },

  // প্রতি উৎস থেকে সর্বোচ্চ কয়টা প্রার্থী তোলা হবে
  limits: {
    topCategory: 120,
    category: 60,
    following: 80,
    trending: 60,
    explore: 80,
    latest: 80,
  },

  // ===== নম্বর দেওয়ার ওজন =====
  rank: {
    wInterest: 0.45,
    wRecency: 0.3,
    wPopularity: 0.15,
    wFollowing: 0.1,
    recencyHalfLifeHours: 36,
    popularityCap: 500,
    freshBoostHours: 3, // এত ঘণ্টার মধ্যে নতুন post একটু বাড়তি সুবিধা পায়
    freshBoost: 0.15,
    exploreJitter: 0.2, // নতুন বিষয়ে একটু এলোমেলো ভাব
  },

  diversity: {
    maxConsecutiveSource: 3, // একই উৎস থেকে পরপর সর্বোচ্চ ৩টা
    authorCooldown: 3, // একই লেখকের post-এর মাঝে অন্তত ৩টা অন্য post
  },

  onboardingMaxSelected: 12,

  // ফিডে যে অবস্থার post কখনো আসবে না
  hiddenStatuses: ["deleted", "removed", "auto_hidden", "hidden"],
};

// "সময়ের সাথে বড় করা" গুণক: প্রতি halfLifeDays দিনে দ্বিগুণ হয়।
// জমা নম্বর ÷ এই গুণক = আসল (ক্ষয় হওয়া) নম্বর
export const decayScale = (nowMs = Date.now()) =>
  Math.pow(
    2,
    (nowMs - FEED_CONFIG.epochMs) / (FEED_CONFIG.halfLifeDays * DAY_MS),
  );
