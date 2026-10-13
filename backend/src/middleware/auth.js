import jwt from "jsonwebtoken";

// মোবাইল অ্যাপ Bearer token পাঠায়, web cookie পাঠায়।
// Bearer আগে চেক করা হচ্ছে, যাতে পুরনো user এর cookie থেকে গেলেও
// নতুন user এর Bearer token-ই কাজ করে।
const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.split(" ")[1];
  if (req.cookies?.token) return req.cookies.token;
  return null;
};

export function protect(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username,
    };
    next();
  } catch {
    req.user = null;
    next();
  }
}
