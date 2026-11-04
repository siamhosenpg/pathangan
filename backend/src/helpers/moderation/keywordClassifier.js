import { CATEGORY_TAXONOMY } from "../feed/categoryTaxonomy.js";

// ===================== Keyword তালিকা (শুধু নিরাপদ category) =====================
// strong = স্পষ্ট, একটাতেই যথেষ্ট (২ পয়েন্ট)
// weak   = দ্ব্যর্থক হতে পারে, অন্য keyword-এর সাথে মিললে কাজে লাগে (১ পয়েন্ট)
// মানুষের নাম আর সাধারণ ইংরেজি শব্দ (react, galaxy) weak-এ, যাতে একা থাকলে ভুল category না হয়।
// ধর্ম, রাজনীতি, কবিতা, প্রেম, মানসিক স্বাস্থ্য এখানে নেই, ওগুলো সবসময় Gemini-তে যায়।
const KEYWORDS = {
  cricket: {
    strong: [
      "ক্রিকেট",
      "cricket",
      "ব্যাটসম্যান",
      "বোলার",
      "উইকেট",
      "wicket",
      "টেস্ট ম্যাচ",
      "ওয়ানডে",
      "টি-টোয়েন্টি",
      "t20",
      "বিপিএল",
      "bpl",
      "আইপিএল",
      "ipl",
    ],
    weak: [
      "ওভার",
      "ইনিংস",
      "সাকিব",
      "তামিম",
      "মুশফিক",
      "মাশরাফি",
      "shakib",
      "tamim",
    ],
  },
  football: {
    strong: [
      "ফুটবল",
      "football",
      "লা লিগা",
      "প্রিমিয়ার লিগ",
      "premier league",
      "বার্সেলোনা",
      "রিয়াল মাদ্রিদ",
      "barcelona",
      "real madrid",
      "ফিফা",
      "fifa",
      "চ্যাম্পিয়নস লিগ",
      "champions league",
    ],
    weak: ["গোল", "পেনাল্টি", "penalty", "মেসি", "রোনালদো", "messi", "ronaldo"],
  },
  programming: {
    strong: [
      "প্রোগ্রামিং",
      "programming",
      "javascript",
      "python",
      "nodejs",
      "node.js",
      "mongodb",
      "next.js",
      "nextjs",
      "github",
      "typescript",
      "mern",
      "কোডিং",
      "coding",
      "ফ্রন্টএন্ড",
      "frontend",
      "ব্যাকএন্ড",
      "backend",
    ],
    weak: [
      "react",
      "api",
      "database",
      "ডাটাবেজ",
      "express",
      "code",
      "কোড",
      "developer",
      "ডেভেলপার",
    ],
  },
  food: {
    strong: [
      "রেসিপি",
      "recipe",
      "বিরিয়ানি",
      "biryani",
      "খিচুড়ি",
      "রেস্টুরেন্ট",
      "restaurant",
      "রান্না",
    ],
    weak: ["পিঠা", "মিষ্টি", "খাবার"],
  },
  travel: {
    strong: [
      "ভ্রমণ",
      "travel",
      "কক্সবাজার",
      "সুন্দরবন",
      "সেন্ট মার্টিন",
      "সাজেক",
      "বান্দরবান",
      "ট্যুর",
      "tour",
    ],
    weak: ["ঘুরতে", "হোটেল", "hotel", "পাহাড়", "সমুদ্র"],
  },
  agriculture: {
    strong: ["কৃষি", "কৃষক", "ফসল", "agriculture", "farmer"],
    weak: ["সেচ", "কীটনাশক", "ফলন", "জমি"],
  },
  career: {
    strong: [
      "চাকরি",
      "ক্যারিয়ার",
      "career",
      "ইন্টারভিউ",
      "interview",
      "ফ্রিল্যান্সিং",
      "freelancing",
      "resume",
      "নিয়োগ বিজ্ঞপ্তি",
    ],
    weak: ["cv", "বেতন", "job", "জব"],
  },
  education: {
    strong: [
      "এসএসসি",
      "এইচএসসি",
      "ssc",
      "hsc",
      "বিশ্ববিদ্যালয়",
      "ভর্তি পরীক্ষা",
      "বৃত্তি",
      "শিক্ষার্থী",
      "admission",
      "university",
    ],
    weak: ["পরীক্ষা", "স্কুল", "কলেজ", "ফলাফল", "ভর্তি", "ক্লাস"],
  },
  space: {
    strong: [
      "মহাকাশ",
      "nasa",
      "নাসা",
      "isro",
      "ইসরো",
      "spacex",
      "গ্রহাণু",
      "ছায়াপথ",
      "গ্যালাক্সি",
      "চন্দ্রযান",
    ],
    weak: ["রকেট", "স্যাটেলাইট", "satellite", "space", "galaxy"],
  },
  music: {
    strong: [
      "গানের",
      "কনসার্ট",
      "concert",
      "অ্যালবাম",
      "album",
      "মিউজিক",
      "music",
    ],
    weak: ["গান", "সুর"],
  },
  gaming: {
    strong: [
      "gaming",
      "গেমিং",
      "gamer",
      "গেমার",
      "pubg",
      "free fire",
      "ফ্রি ফায়ার",
      "minecraft",
      "valorant",
    ],
    weak: ["গেম", "game"],
  },
};

// এই শব্দগুলোর যেকোনোটা থাকলে keyword ফল ব্যবহার হবে না, Gemini যাচাই করবে।
// (অশ্লীল শব্দ আগেই badTextFilter ধরে, এখানে প্রসঙ্গ-নির্ভর বিষয়গুলো)
// শব্দের শুরু মিললেই ধরে (যেমন "ধর্ম" ধরবে "ধর্মীয়"-ও)। নিজের মতো বাড়ান।
const GEMINI_TRIGGERS = [
  // সহিংসতা, যৌনতা, আত্মক্ষতি
  "হত্যা",
  "খুন",
  "আত্মহত্যা",
  "suicide",
  "kill",
  "মারব",
  "মেরে ফেল",
  "কেটে ফেল",
  "জবাই",
  "পুড়িয়ে",
  "মরতে চাই",
  "বাঁচতে চাই না",
  "ধর্ষণ",
  "rape",
  "নগ্ন",
  "porn",
  "পর্ন",
  "sex",
  "সেক্স",
  "বোমা",
  "bomb",
  "জঙ্গি",
  "সন্ত্রাস",
  "terror",
  // মানসিক স্বাস্থ্য
  "মানসিক",
  "ডিপ্রেশন",
  "depression",
  "anxiety",
  "অ্যাংজাইটি",
  // ধর্ম
  "ধর্ম",
  "religion",
  "ইসলাম",
  "islam",
  "মুসলিম",
  "muslim",
  "কুরআন",
  "কোরআন",
  "quran",
  "হাদিস",
  "hadith",
  "আল্লাহ",
  "allah",
  "নামাজ",
  "namaz",
  "রোজা",
  "রমজান",
  "ramadan",
  "মসজিদ",
  "ওয়াজ",
  "হিন্দু",
  "hindu",
  "পূজা",
  "puja",
  "মন্দির",
  "সনাতন",
  "খ্রিস্টান",
  "christian",
  "বাইবেল",
  "bible",
  "গির্জা",
  "বৌদ্ধ",
  "buddhist",
  "নাস্তিক",
  "atheist",
  // রাজনীতি
  "রাজনীতি",
  "politics",
  "নির্বাচন",
  "election",
  "সরকার",
  "আওয়ামী",
  "বিএনপি",
  "জামায়াত",
  "শিবির",
  "ছাত্রলীগ",
  "হাসিনা",
  "ভোট",
  "মন্ত্রী",
  "প্রধানমন্ত্রী",
];

// ===================== সেটিংস =====================
const MIN_SCORE = 2; // সেরা category-র কমপক্ষে এত পয়েন্ট
const MIN_GAP = 2; // প্রথম ও দ্বিতীয় category-র পয়েন্টের ফারাক কমপক্ষে এত
const MAX_KEYWORD_CATEGORIES = 3;
const STRONG_POINTS = 2;
const WEAK_POINTS = 1;
const MAX_FAST_CHARS = 1200; // এর চেয়ে বড় text-এ প্রসঙ্গ বেশি, Gemini ভালো বুঝবে

// ===================== text ও keyword একই নিয়মে পরিষ্কার =====================
const ZERO_WIDTH = /[\u200b\u200c\u200d\u2060\ufeff]/g;

const prepare = (s) =>
  s
    .normalize("NFC") // য়, ড় ইত্যাদি এক রূপে আনে
    .toLowerCase()
    .replace(ZERO_WIDTH, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isLatin = (s) => /^[a-z0-9 .\-+#]+$/.test(s);

// exactEnd = true: শব্দের শেষও মিলতে হবে (ইংরেজিতে plural চলবে, বাংলায় পরে ্ থাকলে চলবে না)
// exactEnd = false: শুধু শুরু মিললেই হবে (trigger-এর জন্য)
// দুই ক্ষেত্রেই শুরুতে boundary লাগে, তাই "আগ্রহ"-এর ভেতরে "গ্রহ" মিলবে না
function buildMatcher(keyword, exactEnd) {
  const k = prepare(keyword);
  if (isLatin(k)) {
    const end = exactEnd ? "(?:s|es)?(?![a-z0-9])" : "";
    return new RegExp(`(?<![a-z0-9])${escapeRegex(k)}${end}`);
  }
  const end = exactEnd ? "(?!\u09CD)" : "";
  return new RegExp(`(?<![\u0980-\u09FF])${escapeRegex(k)}${end}`);
}

const unique = (words) => [...new Set(words.map(prepare))];

const validSlugs = new Set(CATEGORY_TAXONOMY.map((c) => c.slug));

const MATCHERS = Object.entries(KEYWORDS)
  .filter(([slug]) => validSlugs.has(slug)) // ভুল slug থাকলে বাদ
  .map(([slug, { strong = [], weak = [] }]) => ({
    slug,
    strong: unique(strong).map((w) => buildMatcher(w, true)),
    weak: unique(weak).map((w) => buildMatcher(w, true)),
  }));

const TRIGGER_MATCHERS = unique(GEMINI_TRIGGERS).map((w) =>
  buildMatcher(w, false),
);

// ===================== MAIN FUNCTION =====================
// ফেরত দেয়: { categories: [slug...] } অথবা null (মানে Gemini লাগবে)
export function classifyByKeywords(rawText) {
  if (!rawText || typeof rawText !== "string") return null;

  const text = prepare(rawText);
  if (!text || text.length > MAX_FAST_CHARS) return null;

  // সংবেদনশীল বিষয় থাকলে Gemini যাচাই করবে
  if (TRIGGER_MATCHERS.some((re) => re.test(text))) return null;

  const scores = [];
  for (const { slug, strong, weak } of MATCHERS) {
    let score = 0;
    for (const re of strong) if (re.test(text)) score += STRONG_POINTS;
    for (const re of weak) if (re.test(text)) score += WEAK_POINTS;
    if (score > 0) scores.push({ slug, score });
  }

  if (scores.length === 0) return null;

  scores.sort((a, b) => b.score - a.score);

  const top = scores[0];
  const second = scores[1];

  // যথেষ্ট জোরালো মিল নেই
  if (top.score < MIN_SCORE) return null;

  // প্রথম দুটো কাছাকাছি হলে অস্পষ্ট, Gemini ঠিক করুক
  if (second && top.score - second.score < MIN_GAP) return null;

  const categories = [top.slug];
  for (const s of scores.slice(1)) {
    if (categories.length >= MAX_KEYWORD_CATEGORIES) break;
    if (s.score >= MIN_SCORE) categories.push(s.slug);
  }

  return { categories };
}
