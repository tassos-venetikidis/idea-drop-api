import express from "express";
import mongoose from "mongoose";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "../utils/getJwtSecret.js";
import User from "../models/User.js";
import Idea from "../models/Idea.js";
import { generateToken } from "../utils/generateToken.js";

const router = express.Router();

// @route             POST (api/auth/register)
// @description       Register new user
// @access            Public
router.post("/register", async function (req, res, next) {
  try {
    const { name, email, password } = req.body || {};

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
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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

// @route             POST (api/auth/login)
// @description       Authenticate user
// @access            Public
router.post("/login", async function (req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required.");
    }
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      throw new Error("Invalid Credentials");
    }
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid Credentials");
    }
    // Create Tokens
    const payload = { userId: user._id.toString() };
    const accessToken = await generateToken(payload, "1m");
    const refreshToken = await generateToken(payload, "30d");

    // Set refresh token in a HTTP-Only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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

// @route             POST (api/auth/logout)
// @description       Logout user and clear refresh token
// @access            Private
router.post("/logout", async function (req, res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully." });
});

// @route             POST (api/auth/refresh)
// @description       Generate new access token from refresh token
// @access            Public (needs valid refresh token in cookie)
router.post("/refresh", async function (req, res, next) {
  try {
    const token = req.cokies?.refreshToken;
    console.log("Refreshing token...");
    if (!token) {
      res.status(401);
      throw new Error("No refresh token");
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401);
      throw new Error("No user");
    }
    const newAccessToken = await generateToken(
      { userId: user._id.toString() },
      "1m",
    );
    res.json({
      accessToken: newAccessToken,
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    res.status(401);
    next(err);
  }
});

export default router;
