import jwt from "jsonwebtoken";
import User from "../models/usermodel.js";

// এই status এর ইউজার পুরনো token দিয়েও API ব্যবহার করতে পারবে না
const BLOCKED_STATUSES = ["deleted"];

// মোবাইল অ্যাপ Bearer token পাঠায়, web cookie পাঠায়।
// Bearer আগে চেক করা হচ্ছে, যাতে পুরনো user এর cookie থেকে গেলেও
// নতুন user এর Bearer token-ই কাজ করে।
const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.split(" ")[1];
  if (req.cookies?.token) return req.cookies.token;
  return null;
};

// token ঠিক থাকলেও ইউজার এখন ডিলিট অবস্থায় আছে কি না DB তে দেখা হয়
const isBlockedAccount = async (userId) => {
  const dbUser = await User.findById(userId).select("accountStatus").lean();
  return !dbUser || BLOCKED_STATUSES.includes(dbUser.accountStatus);
};

export async function protect(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (await isBlockedAccount(decoded.id)) {
      return res.status(401).json({ message: "Account no longer exists" });
    }

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

export async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (await isBlockedAccount(decoded.id)) {
      req.user = null;
      return next();
    }

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
