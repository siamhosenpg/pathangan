import User from "../models/usermodel.js";
import { hasAcceptedLatestTerms } from "../config/terms.js";

export async function requireTerms(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("terms");
    if (!hasAcceptedLatestTerms(user)) {
      return res
        .status(403)
        .json({ code: "TERMS_REQUIRED", message: "শর্তাবলীতে সম্মত হতে হবে" });
    }
    next();
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
