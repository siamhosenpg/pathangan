import mongoose from "mongoose";
import { MONGODB_URI } from "../config/config.js";

export async function connectDB() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined in environment");
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}
