// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// 🔹 Protect middleware → logged-in user required
export function protect(req, res, next) {
  try {
    const token = req.cookies?.token; // cookie থেকে token নাও

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Token verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // শুধুমাত্র id রাখুন
    next();
  } catch (err) {
    console.error("Protect middleware error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}

// 🔹 Optional Auth → guest / logged-in user allowed
export function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // valid user
    next();
  } catch (err) {
    console.warn("OptionalAuth middleware warning:", err);
    req.user = null; // invalid token → guest
    next();
  }
}
