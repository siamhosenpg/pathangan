import { checkBadText } from "./badTextFilter.js";

// যেকোনো জায়গায় অশ্লীল / ক্ষতিকর text আছে কিনা দেখার জন্য।
// string, array, বা একাধিক field একসাথে দেওয়া যায়:
//   checkTexts(title, description, tags)
//   checkTexts([a, b], c)
// ফেরত দেয়: { flagged, flagType, message }

const MESSAGES = {
  obscene: "এই text-এ অশ্লীল ভাষা আছে",
  harmful: "এই text-এ ক্ষতিকর বিষয় আছে",
  obscene_and_harmful: "এই text-এ অশ্লীল ও ক্ষতিকর বিষয় আছে",
};

function collect(input, out) {
  if (typeof input === "string") {
    if (input.trim()) out.push(input);
  } else if (Array.isArray(input)) {
    input.forEach((i) => collect(i, out));
  }
}

export function checkTexts(...inputs) {
  const pieces = [];
  inputs.forEach((i) => collect(i, pieces));

  let obscene = false;
  let harmful = false;

  // প্রতিটা অংশ আলাদা চেক হয়, যাতে এক field-এর শেষ আর আরেক field-এর শুরু জোড়া না লাগে
  for (const piece of pieces) {
    const r = checkBadText(piece);
    if (!r.flagged) continue;

    if (r.flagType === "obscene" || r.flagType === "obscene_and_harmful") {
      obscene = true;
    }
    if (r.flagType === "harmful" || r.flagType === "obscene_and_harmful") {
      harmful = true;
    }
    if (obscene && harmful) break;
  }

  if (!obscene && !harmful) {
    return { flagged: false, flagType: "none", message: null };
  }

  const flagType =
    obscene && harmful
      ? "obscene_and_harmful"
      : obscene
        ? "obscene"
        : "harmful";

  return { flagged: true, flagType, message: MESSAGES[flagType] };
}

export const hasBadText = (...inputs) => checkTexts(...inputs).flagged;
