// Terms বদলালে শুধু এই তারিখটা বদলান — সব user-কে আবার সম্মতি দিতে হবে
export const TERMS_VERSION = "2026-10-15";

export const hasAcceptedLatestTerms = (user) =>
  user?.terms?.accepted === true && user?.terms?.version === TERMS_VERSION;
