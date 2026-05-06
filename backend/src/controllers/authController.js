import bcrypt from "bcryptjs";
import User from "../models/usermodel.js";
import { generateToken } from "../utils/generateToken.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ===================== REGISTER =====================
export async function register(req, res) {
  try {
    const { name, email, password } = req.body; // username সরানো হয়েছে

    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });

    const emailLower = email.toLowerCase();

    const existing = await User.findOne({ email: emailLower });
    if (existing)
      return res.status(409).json({ message: "Email already in use" });

    // ── Username auto-generate (with unique check) ──
    const baseUsername = name.toLowerCase().trim().split(/\s+/).join(""); // "Siam Hosen" → "siamhosen"

    let username = "";
    let isUnique = false;

    while (!isUnique) {
      const number = Math.floor(10 + Math.random() * 9990); // 10–9999
      username = `${baseUsername}${number}`; // "siamhosen4823"
      const taken = await User.findOne({ username });
      if (!taken) isUnique = true;
    }
    // ────────────────────────────────────────────────

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      name,
      email: emailLower,
      password: hashed,
    });

    const token = generateToken({ id: user._id });

    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
      message: "Registration successful",
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
// ===================== LOGIN =====================
export async function login(req, res) {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    email = email.toLowerCase();

    // Enable password selection
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Optional: check if user is suspended/blocked
    if (user.status !== "active") {
      return res
        .status(403)
        .json({ message: `Account is ${user.status}. Contact support.` });
    }

    const token = generateToken({ id: user._id });

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username || "",
        name: user.name,
        email: user.email,
      },
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ===================== GET CURRENT USER =====================
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
// ===================== LOGOUT =====================
export async function logout(req, res) {
  try {
    // Clear the token cookie
    res.cookie("token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      expires: new Date(0),
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
