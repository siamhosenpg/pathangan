import mongoose from "mongoose";
import { MONGODB_URI } from "../config/config.js";

export async function connectDB() {
  if (!MONGODB_URI) throw new Error("MONGO_URI is not defined in environment");
  try {
    await mongoose.connect(MONGODB_URI, {
      // options are no longer required in latest mongoose, but kept for clarity
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}
