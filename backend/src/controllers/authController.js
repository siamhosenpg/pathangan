import bcrypt from "bcryptjs";
import User from "../models/usermodel.js";
import { generateToken } from "../utils/generateToken.js";
import { TERMS_VERSION, hasAcceptedLatestTerms } from "../config/terms.js";
import { getAccountBlockMessage } from "../utils/accountMessages.js";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

export async function register(req, res) {
  try {
    const { name, email, password, termsAccepted } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    // ✅ শর্তে সম্মতি না দিলে account-ই খোলা যাবে না
    if (termsAccepted !== true) {
      return res
        .status(400)
        .json({ message: "অ্যাকাউন্ট খুলতে শর্তাবলীতে সম্মত হতে হবে" });
    }

    const emailLower = email.toLowerCase();

    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const baseUsername = name.toLowerCase().trim().split(/\s+/).join("");
    let username = "";
    let isUnique = false;

    while (!isUnique) {
      const number = Math.floor(10 + Math.random() * 9990);
      username = `${baseUsername}${number}`;
      const taken = await User.findOne({ username });
      if (!taken) isUnique = true;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      name,
      email: emailLower,
      password: hashed,
      terms: {
        accepted: true,
        acceptedAt: new Date(),
        version: TERMS_VERSION,
      },
    });

    const token = generateToken({
      id: user._id,
      role: user.role,
      username: user.username,
      greenmarkVerified: user.greenmarkVerified || false,
    });

    res.cookie("token", token, getCookieOptions());

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        greenmarkVerified: user.greenmarkVerified || false,
        termsUpToDate: hasAcceptedLatestTerms(user),
      },
      message: "Registration successful",
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ===================== LOGIN =====================
export async function login(req, res) {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    email = email.toLowerCase();

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // শুধু Google দিয়ে খোলা account এ password থাকে না
    if (!user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // deleted / suspended / banned হলে login block
    // (পাসওয়ার্ড মিললে তবেই বার্তা দেখানো হয়, তাই অন্যের account এর অবস্থা জানা যাবে না)
    if (!["active", "warned"].includes(user.accountStatus)) {
      return res.status(403).json({ message: getAccountBlockMessage(user) });
    }

    // role সহ token তৈরি
    const token = generateToken({
      id: user._id,
      role: user.role,
      username: user.username,
      greenmarkVerified: user.greenmarkVerified || false,
    });

    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username || "",
        name: user.name,
        email: user.email,
        role: user.role,
        greenmarkVerified: user.greenmarkVerified || false,
        termsUpToDate: hasAcceptedLatestTerms(user),
      },
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ===================== GET CURRENT USER =====================
export async function getMe(req, res) {
  try {
    const user = await User.findOne({
      _id: req.user.id,
      accountStatus: { $nin: ["deleted"] },
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    const userObj = user.toObject();
    userObj.termsUpToDate = hasAcceptedLatestTerms(user);

    return res.status(200).json({ user: userObj });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ===================== LOGOUT =====================
export async function logout(req, res) {
  try {
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, { $unset: { pushToken: 1 } });
    }
    res.cookie("token", "", {
      ...getCookieOptions(),
      expires: new Date(0),
      maxAge: undefined,
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
