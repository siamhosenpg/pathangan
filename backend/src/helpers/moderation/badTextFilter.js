// ===================== LOCAL BAD TEXT FILTER =====================
// API ছাড়া বাংলা / English / Banglish-এ অশ্লীল ও ক্ষতিকর শব্দ ধরার জন্য।
// তালিকা নিজের মতো বাড়াতে বা কমাতে পারবেন।

const ZERO_WIDTH = /[\u200b\u200c\u200d\u2060\ufeff]/g;
const BENGALI = /[\u0980-\u09FF]/;
const SPLIT = /[\s,.;:!?()"“”\[\]{}\/\\|…।_-]+/;
const WILDCARD_CHARS = new Set(["*", "#", "@", "$", "%"]);

// তালিকার বাংলা শব্দও input-এর মতো NFKC করা হয়, নইলে য়, ড়, ঢ় থাকা শব্দ কখনো মিলবে না
const nb = (s) => s.normalize("NFKC");

// একই অক্ষর পরপর থাকলে একটা করে দেওয়া (fuuuck -> fuck)
const collapse = (s) => s.replace(/(.)\1+/g, "$1");

// disguised spelling: f@ck, sh1t, b1tch
const LEET = {
  "@": "a",
  $: "s",
  0: "o",
  1: "i",
  3: "e",
  4: "a",
  5: "s",
  7: "t",
};
const deLeet = (s) => s.replace(/[@$013457]/g, (ch) => LEET[ch]);

// ---------- বাংলা ----------
const BN_EXACT = new Set(
  [
    "বাল",
    "বালের",
    "ধোন",
    "ধোনের",
    "পোদ",
    "পোঁদ",
    "পোঁদে",
    "পুটকি",
    "পুটকির",
    "হারামি",
    "হারামী",
    "শুয়োর",
    "শুয়োরের",
    "শুওর",
    "রান্ডি",
    "রান্ডির",
    "রাণ্ডি",
  ].map(nb),
);

// এই দিয়ে শুরু হওয়া শব্দ ধরবে (চোদ্দ বাদ যাবে, কারণ পরে ্ থাকে)
const BN_PREFIX = [
  "চুদ",
  "চোদ",
  "মাদারচোদ",
  "বোকাচোদ",
  "বাইনচোদ",
  "খানকি",
  "খানকী",
  "মাগি",
  "মাগী",
  "বেশ্যা",
  "হারামজাদ",
  "গান্ডু",
  "গাণ্ডু",
  "চুতিয়া",
  "চুতমারানি",
].map(nb);

// ---------- English / Banglish (সব ছোট হাতের) ----------
const EN_EXACT = new Set(
  [
    // English
    "bitch",
    "bitches",
    "bastard",
    "asshole",
    "cunt",
    "slut",
    "whore",
    "pussy",
    "dickhead",
    "shit",
    "bullshit",
    "nigger",
    "nigga",
    "faggot",
    // Banglish ("magi" বাদ: collapse হয়ে maggi (নুডলস) ও মিলে যেত)
    "khanki",
    "khankir",
    "chod",
    "choda",
    "chode",
    "chodi",
    "chudir",
    "chudai",
    "chodon",
    "gandu",
    "gandmara",
    "baler",
    "baaler",
    "haramjada",
    "haramzada",
    "harami",
    "putki",
    "putkir",
    "chutiya",
    "chutiye",
    "chutmarani",
    "lauda",
    "lawda",
    "bhenchod",
    "benchod",
    "bhosdike",
    "bhosdi",
  ].map(collapse),
);

// শব্দের ভেতরে থাকলেই ধরবে
const EN_CONTAINS = ["fuck"].map(collapse);

// এই দিয়ে শুরু হলে ধরবে
const ROMAN_PREFIX = [
  "madarchod",
  "madarchud",
  "bokachod",
  "bokachud",
  "bainchod",
  "bhosd",
  "khanki",
  "chudbo",
  "chodbo",
  "chodna",
].map(collapse);

// f**k, s**t ধরার জন্য
const WILDCARD_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "dick",
  "slut",
  "whore",
  "pussy",
  "asshole",
  "bastard",
  "chod",
  "gandu",
];

// ---------- ক্ষতিকর বাক্য (পুরো শব্দ মিলতে হবে) ----------
const HARMFUL_PHRASES = [
  // বাংলা
  "মেরে ফেলব",
  "মেরে ফেলবো",
  "মেরে ফেলবে",
  "মেরে ফেলে দিব",
  "মেরে ফেলে দিবো",
  "খুন করব",
  "খুন করবো",
  "কেটে ফেলব",
  "কেটে ফেলবো",
  "জবাই করব",
  "জবাই করবো",
  "তোকে মারব",
  "তোকে মারবো",
  "মরে যা",
  "মর গিয়ে",
  "আত্মহত্যা করে মর",
  // English
  "kill you",
  "kill yourself",
  "kys",
  "go die",
  "rape you",
  "hang yourself",
  // Banglish
  "mere felbo",
  "mere felbo tore",
  "khun korbo",
  "kete felbo",
  "tore marbo",
  "morte ja",
  "morge ja",
  "moira ja",
].map(nb);

const MESSAGES = {
  obscene: "এই text-এ অশ্লীল ভাষা আছে",
  harmful: "এই text-এ ক্ষতিকর বিষয় আছে",
  obscene_and_harmful: "এই text-এ অশ্লীল ও ক্ষতিকর বিষয় আছে",
};

// f u c k, f.u.c.k, f-u-c-k: পরপর ৩টি বা বেশি একক ইংরেজি অক্ষর জোড়া লাগানো
function joinSpacedLetters(tokens) {
  const out = [];
  let run = [];

  const flush = () => {
    if (run.length >= 3) out.push(run.join(""));
    else out.push(...run);
    run = [];
  };

  for (const t of tokens) {
    if (t.length === 1 && /[a-z]/.test(t)) {
      run.push(t);
    } else {
      flush();
      out.push(t);
    }
  }
  flush();

  return out;
}

function wildcardHit(t) {
  if (t.length < 4) return false;
  if (!/[a-z]/.test(t[0])) return false;
  const letters = [...t].filter((ch) => /[a-z]/.test(ch)).length;
  const wildcards = [...t].filter((ch) => WILDCARD_CHARS.has(ch)).length;
  if (letters < 2 || wildcards === 0) return false;

  return WILDCARD_WORDS.some(
    (w) =>
      w.length === t.length &&
      [...t].every((ch, i) => WILDCARD_CHARS.has(ch) || ch === w[i]),
  );
}

function isObsceneToken(t) {
  if (BENGALI.test(t)) {
    if (BN_EXACT.has(t)) return true;
    return BN_PREFIX.some((p) => t.startsWith(p) && t[p.length] !== "্");
  }

  if (wildcardHit(t)) return true;

  const c = collapse(deLeet(t));
  if (EN_EXACT.has(c)) return true;
  if (EN_CONTAINS.some((w) => c.includes(w))) return true;
  return ROMAN_PREFIX.some((p) => c.startsWith(p));
}

// ফেরত দেয়: { flagged, flagType, message }
export function checkBadText(rawText) {
  const clean = { flagged: false, flagType: "none", message: null };

  if (!rawText || typeof rawText !== "string") return clean;

  const base = rawText
    .normalize("NFKC")
    .toLowerCase()
    .replace(ZERO_WIDTH, "")
    .replace(/['’‘`]/g, "");

  const rawTokens = base.split(SPLIT).filter(Boolean);
  if (rawTokens.length === 0) return clean;

  const tokens = joinSpacedLetters(rawTokens);

  const obscene = tokens.some(isObsceneToken);

  const padded = ` ${tokens.join(" ")} `;
  const harmful = HARMFUL_PHRASES.some((p) => padded.includes(` ${p} `));

  if (!obscene && !harmful) return clean;

  const flagType =
    obscene && harmful
      ? "obscene_and_harmful"
      : obscene
        ? "obscene"
        : "harmful";

  return { flagged: true, flagType, message: MESSAGES[flagType] };
}
