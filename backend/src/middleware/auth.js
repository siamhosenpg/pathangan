// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// ✅ Helper — cookie অথবা Bearer header থেকে token নাও
const extractToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.split(" ")[1];
  return null;
};

// 🔹 Protect middleware → logged-in user required
export function protect(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.error("Protect middleware error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}

// 🔹 Optional Auth → guest / logged-in user allowed
export function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.warn("OptionalAuth middleware warning:", err);
    req.user = null;
    next();
  }
}
