import { generateToken } from "../utils/generateToken.js";
import User from "../models/usermodel.js";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

// ── Web: Google redirect callback ─────────────────────────────────────────────
export async function googleCallback(req, res) {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
      );
    }

    const token = generateToken({ id: user._id });
    res.cookie("token", token, getCookieOptions());

    // token URL এ দিয়ে redirect — frontend localStorage এ রাখবে
    return res.redirect(
      `${process.env.CLIENT_URL}/google/success?token=${token}`,
    );
  } catch (err) {
    console.error("Google callback error:", err);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
  }
}

// ── Mobile: Expo/React Native এর জন্য ────────────────────────────────────────
// expo-auth-session দিয়ে Google থেকে info নিয়ে এখানে POST করবে
// Body: { googleId, email, name, photo }
export async function googleMobileAuth(req, res) {
  try {
    const { googleId, email, name, photo } = req.body;

    if (!googleId || !email) {
      return res
        .status(400)
        .json({ message: "googleId and email are required" });
    }

    const emailLower = email.toLowerCase();
    let user = await User.findOne({ email: emailLower });

    if (user) {
      // আগে থেকে আছে — googleId link করে দাও
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = user.provider === "local" ? "both" : "google";
        if (!user.profileImage && photo) user.profileImage = photo;
        await user.save();
      }
    } else {
      // নতুন user তৈরি করো
      const baseUsername = name
        ? name.toLowerCase().trim().replace(/\s+/g, "")
        : emailLower.split("@")[0];

      let username = "";
      let isUnique = false;
      while (!isUnique) {
        const number = Math.floor(10 + Math.random() * 9990);
        username = `${baseUsername}${number}`;
        const taken = await User.findOne({ username });
        if (!taken) isUnique = true;
      }

      user = await User.create({
        name: name || emailLower.split("@")[0],
        email: emailLower,
        username,
        googleId,
        profileImage: photo || "",
        provider: "google",
      });
    }

    const token = generateToken({ id: user._id });
    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        greenmarkVerified: user.greenmarkVerified || false,
        provider: user.provider,
      },
      message: "Google login successful",
    });
  } catch (err) {
    console.error("Google mobile auth error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
