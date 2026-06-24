import jwt from "jsonwebtoken";

export const optionalProtect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    next();
  }
};
