import Post from "../../models/postmodel.js";

// ─────────────────────────────────────────────
// In-memory IP rate limit store
// Key: "ip:postId" → timestamp (ms)
// প্রতি 6 ঘন্টায় একবার একই IP → same post এ view count হবে
// ─────────────────────────────────────────────
const viewRateLimitStore = new Map();

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// পুরনো entries clean করার জন্য — memory leak এড়াতে
// প্রতি ১ ঘন্টায় expired entries মুছবে
setInterval(
  () => {
    const now = Date.now();
    for (const [key, timestamp] of viewRateLimitStore.entries()) {
      if (now - timestamp > SIX_HOURS_MS) {
        viewRateLimitStore.delete(key);
      }
    }
  },
  60 * 60 * 1000,
);

// ─────────────────────────────────────────────
// Helper: Real IP বের করা (proxy এর পেছনে থাকলেও)
// Render/Vercel এ "trust proxy 1" set থাকায় req.ip correct আসে
// ─────────────────────────────────────────────
const getClientIp = (req) => {
  return (
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

// ─────────────────────────────────────────────
// POST /posts/view/:postId
//
// Frontend থেকে call আসবে যখন:
//   - Image/text post: 3 সেকেন্ড screen এ দেখা হয়েছে
//   - Video post: duration এর 10% দেখা হয়েছে
//
// Rate limit: একই IP + একই postId → 6 ঘন্টায় একবার
// Auth optional — logged in বা guest দুজনেই view করতে পারবে
// ─────────────────────────────────────────────
export const recordView = async (req, res) => {
  try {
    const { postId } = req.params;

    // ── Basic validation ──
    if (!postId || postId.length !== 24) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const clientIp = getClientIp(req);

    // ── Rate limit check ──
    // Key format: "192.168.1.1:507f1f77bcf86cd799439011"
    const rateLimitKey = `${clientIp}:${postId}`;
    const lastViewTime = viewRateLimitStore.get(rateLimitKey);
    const now = Date.now();

    if (lastViewTime && now - lastViewTime < SIX_HOURS_MS) {
      // 6 ঘন্টা হয়নি — view count বাড়বে না কিন্তু 200 return করবে
      // (Frontend এ error দেখাবে না, silently ignore)
      return res.status(200).json({ counted: false, message: "Rate limited" });
    }

    // ── Post exists কিনা check (updateOne দিয়ে একবারেই করা) ──
    const result = await Post.updateOne(
      { _id: postId },
      { $inc: { viewsCount: 1 } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ── Rate limit store এ timestamp save ──
    viewRateLimitStore.set(rateLimitKey, now);

    return res.status(200).json({ counted: true });
  } catch (err) {
    // CastError = invalid ObjectId format
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid post id format" });
    }
    console.error("View record error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
