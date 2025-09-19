import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "./db";
import { authenticateToken, AuthenticatedRequest } from "./middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// Define Mongoose User schema/model
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Missing name, email or password" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, passwordHash });

    return res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to sign up" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to login" });
  }
});

authRouter.put("/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to update profile" });
  }
});

export default authRouter;
