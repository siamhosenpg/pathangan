import mongoose from "mongoose";
const { Schema } = mongoose;

// =============================
// 🔹 Sub-schemas (nested parts)
// =============================

// Login history schema
const LoginHistorySchema = new Schema(
  {
    ip: String,
    device: String,
    location: String,
    loginAt: Date,
  },
  { _id: false },
);

// Notifications & Privacy inside settings
const SettingsSchema = new Schema(
  {
    theme: { type: String, default: "light" },
    language: { type: String, default: "en" },
    notifications: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
    },
    privacy: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      allowTagging: { type: Boolean, default: true },
      allowMessagesFrom: {
        type: String,
        enum: ["everyone", "followers", "none"],
        default: "followers",
      },
    },
  },
  { _id: false },
);

// Security schema
const SecuritySchema = new Schema(
  {
    twoFactorAuth: { type: Boolean, default: false },
    lastPasswordChange: { type: Date },
    loginHistory: [LoginHistorySchema],
  },
  { _id: false },
);

// =============================
// 🔹 Main User Schema
// =============================
const UserSchema = new Schema(
  {
    userid: { type: Number, unique: true },

    username: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },

    profileImage: { type: String },
    coverImage: { type: String },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, "Bio সর্বোচ্চ 300 অক্ষরের হতে পারবে"],
    },
    work: { type: [String], trim: true },
    educations: { type: [String], trim: true },
    aboutText: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "Gender must be male, female, or other",
      },
      default: "male",
    },
    dateOfBirth: { type: Date },
    location: { type: String, trim: true },
    website: { type: String, trim: true },
    phone: { type: String, trim: true },
    blockedUsers: [{ type: Number }],

    accountType: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    verified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    settings: { type: SettingsSchema, default: {} },
    security: { type: SecuritySchema, default: {} },

    preferences: {
      contentVisibility: {
        type: String,
        enum: ["everyone", "friends_only", "private"],
        default: "everyone",
      },
      autoPlayVideos: { type: Boolean, default: true },
    },

    badges: [{ type: String }],

    activityStats: {
      totalPosts: { type: Number, default: 0 },
      totalLikesGiven: { type: Number, default: 0 },
      totalLikesReceived: { type: Number, default: 0 },
      totalComments: { type: Number, default: 0 },
      totalFollowers: { type: Number, default: 0 },
      totalFollowing: { type: Number, default: 0 },
    },

    joinedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

// Indexes
UserSchema.index({
  name: "text",
  username: "text",
  email: "text",
});
UserSchema.index({ "settings.language": 1 });

// =============================
// 🔥 Auto User ID Generator
// =============================
UserSchema.pre("save", async function (next) {
  if (!this.userid) {
    this.userid = Math.floor(1000000 + Math.random() * 9000000);
  }
  next();
});

// =============================
// 🔥 Model Export
// =============================
const User = mongoose.model("User", UserSchema);
export default User;
