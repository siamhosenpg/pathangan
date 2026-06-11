import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/usermodel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const googleId = profile.id;
        const displayName = profile.displayName || "";
        const photo = profile.photos?.[0]?.value || "";

        if (!email) return done(new Error("Google account has no email"), null);

        // ── Case 1: Email আগে থেকে আছে ──────────────────────────────
        let user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = googleId;
            user.provider = user.provider === "local" ? "both" : "google";
            if (!user.profileImage && photo) user.profileImage = photo;
            await user.save();
          }
          return done(null, user);
        }

        // ── Case 2: সম্পূর্ণ নতুন user ──────────────────────────────
        const baseUsername = displayName
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "");

        let username = "";
        let isUnique = false;
        while (!isUnique) {
          const number = Math.floor(10 + Math.random() * 9990);
          username = `${baseUsername}${number}`;
          const taken = await User.findOne({ username });
          if (!taken) isUnique = true;
        }

        user = await User.create({
          name: displayName,
          email,
          username,
          googleId,
          profileImage: photo,
          provider: "google",
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
