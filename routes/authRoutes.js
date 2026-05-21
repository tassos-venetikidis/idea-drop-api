import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Idea from "../models/Idea.js";
import { generateToken } from "../utils/generateToken.js";

const router = express.Router();

// @route             POST (api/auth/register)
// @description       Register new user
// @access            Public
router.post("/register", async function (req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("All fields are required.");
    }

    const existingUser = await Idea.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error("User already exists.");
    }

    const user = await User.create({ name, email, password });

    // Create Tokens
    const payload = { userId: user._id.toString() };
    const accessToken = await generateToken(payload, "1m");
    const refreshToken = await generateToken(payload, "30d");

    // Set refresh token in a HTTP-Only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days expressed in msec
    });

    res.status(201).json({
      accessToken,
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

export default router;
