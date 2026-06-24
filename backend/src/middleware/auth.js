import jwt from "jsonwebtoken";

const extractToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.split(" ")[1];
  return null;
};

export function protect(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
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
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    req.user = null;
    next();
  }
}
