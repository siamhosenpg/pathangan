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

    const token = generateToken({
      id: user._id,
      role: user.role,
      username: user.username,
      greenmarkVerified: user.greenmarkVerified || false,
    });
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
// expo-auth-session থেকে পাওয়া accessToken এখানে POST করবে
// Body: { accessToken }
// Backend নিজে Google থেকে user info verify করবে
export async function googleMobileAuth(req, res) {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: "accessToken required" });
    }

    // Google থেকে token verify করে user info আনো
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!r.ok) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const g = await r.json(); // { sub, email, email_verified, name, picture }

    if (!g.email_verified) {
      return res.status(401).json({ message: "Google email not verified" });
    }

    const googleId = g.sub;
    const email = g.email;
    const name = g.name;
    const photo = g.picture;

    if (!googleId || !email) {
      return res.status(400).json({ message: "Invalid Google profile" });
    }

    const emailLower = email.toLowerCase();
    let user = await User.findOne({ email: emailLower });

    if (user) {
      // suspended / banned হলে login block (normal login এর মতোই)
      if (!["active", "warned"].includes(user.accountStatus)) {
        const messages = {
          suspended: `Account suspended until ${user.suspension?.expiresAt ? new Date(user.suspension.expiresAt).toLocaleDateString() : "further notice"}. Reason: ${user.suspension?.reason ?? "policy violation"}`,
          banned: "Account permanently banned. Contact support.",
          deactivated: "Account deactivated. Please reactivate to continue.",
          deleted: "Account no longer exists.",
          under_review: "Account is under review. Contact support.",
        };

        return res.status(403).json({
          message:
            messages[user.accountStatus] ??
            `Account is ${user.accountStatus}. Contact support.`,
        });
      }

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
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
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
