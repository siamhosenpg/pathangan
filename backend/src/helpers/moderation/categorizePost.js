import {
  GoogleGenAI,
  Type,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/genai";
import {
  ALL_CATEGORY_SLUGS,
  GENERAL_CATEGORY,
  normalizeCategory,
} from "../feed/categoryTaxonomy.js";

// Model-এর নাম পরিবর্তন হতে পারে, ai.google.dev/gemini-api/docs/models থেকে দেখে নিন
const MODEL = "gemini-3-flash-preview";

const MAX_INPUT_CHARS = 4000; // এর বেশি বড় text কেটে ফেলা হবে
const MIN_INPUT_CHARS = 3; // এর কম হলে Gemini call হবে না
const MAX_ATTEMPTS = 3; // ব্যর্থ হলে মোট কতবার চেষ্টা করবে
const ATTEMPT_DELAY_MS = 800; // চেষ্টার মাঝে বিরতি (800ms, তারপর 1600ms)
const MAX_OUTPUT_TOKENS = 2048; // thinking-এর token সহ, কম হলে JSON কেটে যেতে পারে
const MAX_CATEGORIES = 3;

// text না থাকলে এই category যাবে (ফিডে নিরপেক্ষ ধরা হয়, আগ্রহে কিছু যোগ করে না)
export const DEFAULT_CATEGORIES = [GENERAL_CATEGORY];

// Client প্রথম ব্যবহারের সময় তৈরি হবে (dotenv লোড হওয়ার পরে)
let ai = null;
const getClient = () => {
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    categories: {
      type: Type.ARRAY,
      // API যদি enum নিয়ে error দেয়, নিচের enum লাইনটা মুছে দিন।
      // normalize করা হয় বলে তালিকার বাইরের কিছু এলেও ফেলে দেওয়া হবে
      items: { type: Type.STRING, enum: ALL_CATEGORY_SLUGS },
      minItems: 1,
      maxItems: MAX_CATEGORIES,
    },
    isObscene: { type: Type.BOOLEAN },
    isHarmful: { type: Type.BOOLEAN },
  },
  required: ["categories", "isObscene", "isHarmful"],
};

const systemInstruction =
  "You are a text classifier and content moderator, not a chatbot. Never reply to the text or explain anything. " +
  'Output only JSON: {"categories": [1 to 3 strings], "isObscene": boolean, "isHarmful": boolean}. ' +
  `categories: 1 to 3 values chosen ONLY from this exact list (copy each value exactly): ${ALL_CATEGORY_SLUGS.join(", ")}. ` +
  "Most relevant first. Prefer the most specific topic over a broad one (for example cricket instead of sports, programming instead of technology). " +
  `If nothing fits, use ["${GENERAL_CATEGORY}"]. ` +
  "The text may be in any language, including Bengali and Banglish (Bengali written in English letters). " +
  "isObscene: set true ONLY when the text uses clearly vulgar, filthy or abusive WORDS, such as explicit sexual slang or crude terms for body parts or sex acts, " +
  "or heavy curse words and obscene insults, including disguised spellings like f**k. " +
  "Set isObscene to false for romance, love, affection, longing, kissing, hugging, flirting, romantic stories, poems, songs, and mild or tasteful sensual or emotional writing. " +
  "A romantic or love-themed text is NOT obscene just because it is about love or intimacy. Judge the language used, not the topic. " +
  "If you are unsure, set isObscene to false. " +
  "isHarmful: set true ONLY for real threats, incitement to violence, hate speech against a group, targeted harassment, or encouragement of self-harm. " +
  "Romance, love and ordinary emotional or sad writing are not harmful. If unsure, set isHarmful to false.";

// Gemini নিজে block না করে শুধু বিশ্লেষণ করুক
const safetySettings = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map((category) => ({ category, threshold: HarmBlockThreshold.BLOCK_NONE }));

// একই text বারবার এলে Gemini call না করে আগের ফল দেওয়ার জন্য
// (শুধু সফল ফল জমা হয়, ব্যর্থতা কখনো জমা হয় না)
const cache = new Map();
const CACHE_LIMIT = 500;

// Gemini-র উত্তর থেকে ফল বের করার নিরাপদ function
function extractResult(raw) {
  if (!raw) return null;

  const tryParse = (str) => {
    try {
      const obj = JSON.parse(str);
      if (obj && Array.isArray(obj.categories)) return obj;
    } catch {
      // পরের ধাপে যাও
    }
    return null;
  };

  let obj = tryParse(raw);

  if (!obj) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) obj = tryParse(match[0]);
  }

  if (!obj) return null;

  // তালিকার category-তে নামিয়ে আনা; অচেনা, খালি ও একই category বাদ
  const seen = new Set();
  const categories = obj.categories
    .map((c) => normalizeCategory(c))
    .filter((c) => {
      if (!c || seen.has(c)) return false;
      seen.add(c);
      return true;
    })
    .slice(0, MAX_CATEGORIES);

  return {
    // কিছুই না মিললে general (এটা ব্যর্থতা না, নিরপেক্ষ ফল)
    categories: categories.length > 0 ? categories : [GENERAL_CATEGORY],
    isObscene: obj.isObscene === true,
    isHarmful: obj.isHarmful === true,
  };
}

// Flag অনুযায়ী ধরন ও বাংলা বার্তা তৈরি
function buildFlag({ isObscene, isHarmful }) {
  if (isObscene && isHarmful) {
    return {
      flagged: true,
      flagType: "obscene_and_harmful",
      message: "এই text-এ অশ্লীল ও ক্ষতিকর বিষয় আছে",
    };
  }
  if (isObscene) {
    return {
      flagged: true,
      flagType: "obscene",
      message: "এই text-এ অশ্লীল ভাষা আছে",
    };
  }
  if (isHarmful) {
    return {
      flagged: true,
      flagType: "harmful",
      message: "এই text-এ ক্ষতিকর বিষয় আছে",
    };
  }
  return { flagged: false, flagType: "none", message: null };
}

async function askGemini(text) {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: `Classify the following text.\n\nText:\n"""\n${text}\n"""`,
    config: {
      systemInstruction,
      safetySettings,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.1,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      // এই লাইনে error এলে পুরো thinkingConfig লাইনটা মুছে দিন
      thinkingConfig: { thinkingLevel: "low" },
    },
  });

  // Gemini নিজে block করে দিলে (খুব মারাত্মক কন্টেন্টে এমন হতে পারে)
  const blockReason = response.promptFeedback?.blockReason;
  const finishReason = response.candidates?.[0]?.finishReason;
  const blockedBySafety =
    Boolean(blockReason) ||
    ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"].includes(
      finishReason,
    );

  if (blockedBySafety) {
    return { blocked: true, raw: null, result: null, finishReason };
  }

  const raw = response.text;
  return { blocked: false, raw, result: extractResult(raw), finishReason };
}

// ===================== MAIN FUNCTION =====================
// ফেরত দেয়: { categories, flagged, flagType, message, failed? }
// failed: true মানে Gemini থেকে কোনো ফল পাওয়া যায়নি (এটা "normal" না)
// কখনো throw করে না
export async function categorizePost(rawText) {
  const normal = {
    categories: DEFAULT_CATEGORIES,
    flagged: false,
    flagType: "none",
    message: null,
  };

  // text না থাকলে (শুধু ছবি/ভিডিও) বা খুব ছোট হলে Gemini লাগবে না
  if (
    !rawText ||
    typeof rawText !== "string" ||
    rawText.trim().length < MIN_INPUT_CHARS
  ) {
    return normal;
  }

  const text = rawText.trim().slice(0, MAX_INPUT_CHARS);

  if (cache.has(text)) return cache.get(text);

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // 503 / 429 এর মতো সাময়িক সমস্যায় একটু থেমে আবার চেষ্টা
      if (attempt > 1) await sleep(ATTEMPT_DELAY_MS * (attempt - 1));

      let out;
      try {
        out = await askGemini(text);
      } catch (err) {
        console.warn(
          `Categorize চেষ্টা ${attempt}/${MAX_ATTEMPTS} ব্যর্থ:`,
          err.message,
        );
        continue;
      }

      // Gemini block করলে ক্ষতিকর ধরে নেওয়া হবে
      if (out.blocked) {
        const payload = {
          categories: DEFAULT_CATEGORIES,
          ...buildFlag({ isObscene: false, isHarmful: true }),
        };
        cache.set(text, payload);
        return payload;
      }

      if (out.result) {
        const payload = {
          categories: out.result.categories,
          ...buildFlag(out.result),
        };

        // Cache ভরে গেলে সবচেয়ে পুরোনোটা ফেলে দেওয়া
        if (cache.size >= CACHE_LIMIT) {
          cache.delete(cache.keys().next().value);
        }
        cache.set(text, payload);
        return payload;
      }

      console.warn(
        `Categorize চেষ্টা ${attempt}/${MAX_ATTEMPTS}: ঠিক format আসেনি (finishReason: ${out.finishReason}).`,
        out.raw,
      );
    }
  } catch (err) {
    console.error("Categorize error:", err);
  }

  // সব চেষ্টা ব্যর্থ। "normal" বলে ধরা হচ্ছে না, caller পরে আবার চেষ্টা করবে
  console.error("Categorize: সব চেষ্টা ব্যর্থ হয়েছে");
  return { ...normal, failed: true };
}
