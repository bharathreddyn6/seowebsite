import mongoose from "mongoose";

/**
 * Initialize a connection to MongoDB via Mongoose.
 * - Uses MONGODB_URI from environment variables.
 * - Optionally uses MONGODB_DB for dbName if provided.
 * - If no URI is set, logs a warning and skips connecting (allowing in-memory fallback in dev).
 */
export async function connectMongo(customUri?: string) {
  const uri = customUri || process.env.MONGODB_URI;

  if (!uri) {
    console.warn("[mongo] MONGODB_URI not set; skipping MongoDB connection. Auth routes that rely on MongoDB will fail.");
    return;
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || undefined,
    });
    console.log("[mongo] connected");
  } catch (err) {
    console.error("[mongo] connection error:", err);
    throw err;
  }
}

export default mongoose;
