// ===================== ফিডের জন্য নির্দিষ্ট category তালিকা =====================
// slug সবসময় ছোট হাতের ইংরেজি। en/bn শুধু app-এ দেখানোর জন্য।
// তালিকা বাড়াতে চাইলে এখানে যোগ করুন, তারপর পুরোনো post-এর জন্য backfill script চালান।
// পুরোনো slug কখনো মুছবেন বা rename করবেন না, করলে জমা থাকা আগ্রহ নষ্ট হবে।

export const CATEGORY_TAXONOMY = [
  { slug: "technology", en: "Technology", bn: "প্রযুক্তি" },
  { slug: "programming", en: "Programming", bn: "প্রোগ্রামিং" },
  { slug: "science", en: "Science", bn: "বিজ্ঞান" },
  { slug: "education", en: "Education", bn: "শিক্ষা" },
  { slug: "career", en: "Career", bn: "ক্যারিয়ার" },
  { slug: "business", en: "Business", bn: "ব্যবসা" },
  { slug: "finance", en: "Finance", bn: "অর্থ ও বিনিয়োগ" },
  { slug: "news", en: "News", bn: "খবর" },
  { slug: "politics", en: "Politics", bn: "রাজনীতি" },
  { slug: "religion", en: "Religion", bn: "ধর্ম" },
  { slug: "islam", en: "Islam", bn: "ইসলাম" },
  { slug: "hinduism", en: "Hinduism", bn: "হিন্দুধর্ম" },
  { slug: "christianity", en: "Christianity", bn: "খ্রিস্টধর্ম" },
  { slug: "buddhism", en: "Buddhism", bn: "বৌদ্ধধর্ম" },
  { slug: "history", en: "History", bn: "ইতিহাস" },
  { slug: "literature", en: "Literature", bn: "সাহিত্য" },
  { slug: "poetry", en: "Poetry", bn: "কবিতা" },
  { slug: "romance", en: "Romance", bn: "প্রেম" },
  { slug: "relationships", en: "Relationships", bn: "সম্পর্ক" },
  { slug: "family", en: "Family", bn: "পরিবার" },
  { slug: "health", en: "Health", bn: "স্বাস্থ্য" },
  { slug: "mental-health", en: "Mental Health", bn: "মানসিক স্বাস্থ্য" },
  { slug: "fitness", en: "Fitness", bn: "ফিটনেস" },
  { slug: "food", en: "Food", bn: "খাবার" },
  { slug: "travel", en: "Travel", bn: "ভ্রমণ" },
  { slug: "nature", en: "Nature", bn: "প্রকৃতি" },
  { slug: "agriculture", en: "Agriculture", bn: "কৃষি" },
  { slug: "cricket", en: "Cricket", bn: "ক্রিকেট" },
  { slug: "football", en: "Football", bn: "ফুটবল" },
  { slug: "sports", en: "Other Sports", bn: "অন্যান্য খেলা" },
  { slug: "music", en: "Music", bn: "গান" },
  { slug: "movies", en: "Movies & TV", bn: "সিনেমা ও নাটক" },
  { slug: "gaming", en: "Gaming", bn: "গেমিং" },
  { slug: "art", en: "Art & Design", bn: "শিল্প ও ডিজাইন" },
  { slug: "photography", en: "Photography", bn: "ফটোগ্রাফি" },
  { slug: "fashion", en: "Fashion", bn: "ফ্যাশন" },
  { slug: "humor", en: "Humor", bn: "মজা ও হাস্যরস" },
  { slug: "motivation", en: "Motivation", bn: "অনুপ্রেরণা" },
  { slug: "philosophy", en: "Philosophy", bn: "দর্শন" },
  { slug: "culture", en: "Culture", bn: "সংস্কৃতি" },
  { slug: "law", en: "Law", bn: "আইন" },
  { slug: "automobiles", en: "Automobiles", bn: "যানবাহন" },
  { slug: "shopping", en: "Shopping", bn: "কেনাকাটা" },
  { slug: "pets", en: "Pets & Animals", bn: "পশুপাখি" },
  { slug: "lifestyle", en: "Lifestyle", bn: "জীবনযাপন" },
  { slug: "community", en: "Community & Society", bn: "সমাজ" },
  { slug: "space", en: "Space", bn: "মহাকাশ" },
];

// কোনো বিষয়ে না মিললে বা text না থাকলে। আগ্রহে কিছু যোগ করে না
export const GENERAL_CATEGORY = "general";

export const ALL_CATEGORY_SLUGS = [
  ...CATEGORY_TAXONOMY.map((c) => c.slug),
  GENERAL_CATEGORY,
];

export const CATEGORY_BY_SLUG = new Map(
  CATEGORY_TAXONOMY.map((c) => [c.slug, c]),
);

const SLUG_SET = new Set(ALL_CATEGORY_SLUGS);

const NEUTRAL_KEYS = new Set([
  GENERAL_CATEGORY,
  "normal content",
  "other",
  "others",
  "misc",
  "miscellaneous",
]);

const LABEL_TO_SLUG = new Map(
  CATEGORY_TAXONOMY.map((c) => [c.en.toLowerCase(), c.slug]),
);

// আগের Gemini-র মুক্ত লেখা category গুলোকে তালিকায় আনার জন্য
// নিয়ম: key ছোট হাতের হবে, value অবশ্যই CATEGORY_TAXONOMY-র একটা slug হবে, key দুইবার লেখা যাবে না
const ALIASES = {
  // programming
  coding: "programming",
  software: "programming",
  "software development": "programming",
  "web development": "programming",
  "app development": "programming",
  javascript: "programming",
  developer: "programming",

  // technology
  tech: "technology",
  gadgets: "technology",
  ai: "technology",
  "artificial intelligence": "technology",
  internet: "technology",

  // education
  study: "education",
  exam: "education",
  school: "education",
  university: "education",
  learning: "education",
  students: "education",

  // career
  job: "career",
  jobs: "career",
  "job search": "career",
  freelancing: "career",

  // finance
  economy: "finance",
  investment: "finance",
  money: "finance",
  banking: "finance",

  // romance
  love: "romance",
  "love story": "romance",
  "love stories": "romance",
  romantic: "romance",
  "romantic love": "romance",

  // ধর্ম (সাধারণ)
  religious: "religion",
  spirituality: "religion",
  faith: "religion",
  interfaith: "religion",
  "comparative religion": "religion",
  meditation: "religion",

  // ইসলাম
  islamic: "islam",
  muslim: "islam",
  quran: "islam",
  koran: "islam",
  tafsir: "islam",
  hadith: "islam",
  hadis: "islam",
  sunnah: "islam",
  namaz: "islam",
  salah: "islam",
  roja: "islam",
  ramadan: "islam",
  dua: "islam",
  hajj: "islam",
  waz: "islam",
  khutbah: "islam",
  sufism: "islam",
  tasawwuf: "islam",

  // হিন্দুধর্ম
  hindu: "hinduism",
  "sanatan dharma": "hinduism",
  puja: "hinduism",

  // খ্রিস্টধর্ম
  christian: "christianity",
  bible: "christianity",
  church: "christianity",

  // বৌদ্ধধর্ম
  buddhist: "buddhism",
  buddha: "buddhism",

  // humor
  joke: "humor",
  jokes: "humor",
  comedy: "humor",
  funny: "humor",
  meme: "humor",
  memes: "humor",

  // movies
  movie: "movies",
  film: "movies",
  cinema: "movies",
  tv: "movies",
  drama: "movies",
  entertainment: "movies",
  "web series": "movies",

  // sports ও গান
  soccer: "football",
  song: "music",
  songs: "music",

  // সাহিত্য
  poem: "poetry",
  poems: "poetry",
  poet: "poetry",
  story: "literature",
  stories: "literature",
  book: "literature",
  books: "literature",
  writing: "literature",

  // fitness
  workout: "fitness",
  gym: "fitness",
  exercise: "fitness",

  // food
  recipe: "food",
  recipes: "food",
  cooking: "food",

  // politics
  politic: "politics",
  government: "politics",
  election: "politics",

  // automobiles
  cars: "automobiles",
  bike: "automobiles",
  bikes: "automobiles",

  // pets
  pet: "pets",
  animals: "pets",

  // community
  society: "community",
  social: "community",
  "social issues": "community",

  // motivation
  inspiration: "motivation",
  "self improvement": "motivation",
  "self-improvement": "motivation",

  // space
  astronomy: "space",
  isro: "space",
  nasa: "space",

  // mental-health
  depression: "mental-health",
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

// যেকোনো লেখা → তালিকার slug (চিনতে না পারলে null)
export function normalizeCategory(raw) {
  if (typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase();
  if (!key) return null;

  if (NEUTRAL_KEYS.has(key)) return GENERAL_CATEGORY;
  if (SLUG_SET.has(key)) return key;
  if (LABEL_TO_SLUG.has(key)) return LABEL_TO_SLUG.get(key);
  if (hasOwn(ALIASES, key)) return ALIASES[key];
  return null;
}

// আগ্রহ গোনার জন্য: চেনা, নিরপেক্ষ নয় এমন category, সর্বোচ্চ max টা
export function getSignalCategories(list, max = 3) {
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const result = [];

  for (const raw of list) {
    const slug = normalizeCategory(raw);
    if (!slug || slug === GENERAL_CATEGORY || seen.has(slug)) continue;
    seen.add(slug);
    result.push(slug);
    if (result.length >= max) break;
  }

  return result;
}

// database-এ খোঁজার সময় যে মানগুলো মেলাতে হবে।
// পুরোনো post-এ "Cricket" লেখা থাকলেও backfill-এর আগে যেন ধরা পড়ে
export function categoryQueryValues(slug) {
  const entry = CATEGORY_BY_SLUG.get(slug);
  return entry ? [slug, entry.en] : [slug];
}
