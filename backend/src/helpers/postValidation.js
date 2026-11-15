export const TITLE_MIN = 10;
export const TITLE_MAX = 120;
export const TITLE_ONLY_MIN = 50;
export const TEXT_MIN = 50;
export const QUESTION_MIN = 50;

const MESSAGES = {
  errEmptyPost:
    "Title or description is required. A post with only an image/video is not allowed",
  errTitleTooLong: `Title can be at most ${TITLE_MAX} characters`,
  errTitleTooShort: `Title must be at least ${TITLE_MIN} characters`,
  errTitleOnlyTooShort: `A title-only post needs at least ${TITLE_ONLY_MIN} characters, or add a description`,
  errTextTooShort: `Description must be at least ${TEXT_MIN} characters`,
  errEmptyQuestion: "questionText is required",
  errQuestionTooShort: `Question must be at least ${QUESTION_MIN} characters`,
};

const toMessage = (code) => (code ? MESSAGES[code] : null);

// মিডিয়া থাকুক বা না থাকুক, নিয়ম একই
export const validateNormalPost = ({ title = "", text = "" }) => {
  const t = String(title).trim();
  const x = String(text).trim();

  if (t.length > TITLE_MAX) return toMessage("errTitleTooLong");
  if (!t && !x) return toMessage("errEmptyPost");

  if (t && x) {
    if (t.length < TITLE_MIN) return toMessage("errTitleTooShort");
    if (x.length < TEXT_MIN) return toMessage("errTextTooShort");
    return null;
  }

  if (x) return x.length >= TEXT_MIN ? null : toMessage("errTextTooShort");

  return t.length >= TITLE_ONLY_MIN ? null : toMessage("errTitleOnlyTooShort");
};

export const validateQuestion = (questionText = "") => {
  const q = String(questionText).trim();
  if (!q) return toMessage("errEmptyQuestion");
  if (q.length < QUESTION_MIN) return toMessage("errQuestionTooShort");
  return null;
};
