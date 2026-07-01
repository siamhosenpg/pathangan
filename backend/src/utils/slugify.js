export const generateSlug = (title) => {
  const base = title
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, "") // বাংলা + ইংরেজি অক্ষর, সংখ্যা রাখা
    .replace(/\s+/g, "-")
    .slice(0, 80);

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${randomSuffix}`;
};

export const countWords = (text = "") => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export const calcReadTime = (wordCount) => {
  // গড়ে প্রতি মিনিটে ২০০ শব্দ পড়ার হিসাবে
  return Math.max(1, Math.ceil(wordCount / 200));
};
