import jwt from "jsonwebtoken"; // ← এটা add করো

// middleware/auth.js তে add করো
export const optionalProtect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return next(); // token নেই → req.user = undefined → চলতে থাকো

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch {
    next(); // invalid token হলেও block করবে না
  }
};
