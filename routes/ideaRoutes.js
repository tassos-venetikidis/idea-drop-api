import express from "express";
import Idea from "../models/Idea.js";
import mongoose from "mongoose";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route        GET /api/ideas
// @description  Get all ideas
// @access       Public
// @query        _limit (optional limit for ideas returned)
router.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query._limit);
    const query = Idea.find().sort({ createdAt: -1 });
    if (!isNaN(limit)) {
      query.limit(limit);
    }
    const ideas = await query.exec();
    res.json(ideas);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// @route        GET /api/ideas/:ideaId
// @description  Get single idea
// @access       Public
router.get("/:ideaId", async (req, res, next) => {
  const { ideaId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(ideaId)) {
    res.status(404);
    throw new Error("Idea Not Found");
  }

  try {
    const idea = await Idea.findById(ideaId);
    if (!idea) {
      res.status(404);
      throw new Error("Idea Not Found");
    }
    res.json(idea);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// @route        POST /api/ideas
// @description  Create new idea
// @access       Public
router.post("/", protect, async (req, res, next) => {
  try {
    const { title, summary, description, tags } = req.body || {};

    if (!title?.trim() || !summary?.trim() || !description?.trim()) {
      res.status(400);
      throw new Error("Title, summary and description are required!");
    }

    const newIdea = new Idea({
      title: title.trim(),
      summary: summary.trim(),
      description: description.trim(),
      tags:
        typeof tags === "string"
          ? tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag !== "")
          : Array.isArray(tags)
            ? tags
            : [],
      user: req.user._id,
    });

    const savedIdea = await newIdea.save();
    res.status(201).json(savedIdea);
  } catch (err) {
    console.log(err.message);
    next(err);
  }
});

// @route        PUT /api/ideas/:ideaId
// @description  Update single idea
// @access       Public
router.put("/:ideaId", protect, async (req, res, next) => {
  try {
    const { ideaId } = req.params;

    const idea = await Idea.findById(ideaId);

    if (!idea) {
      res.status(404);
      throw new Error("Idea Not Found");
    }

    // Check if user owns idea
    if (idea.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to update this idea.");
    }

    const { title, summary, description, tags } = req.body || {};

    if (!title?.trim() || !summary?.trim() || !description?.trim()) {
      res.status(400);
      throw new Error("Title, summary and description are required!");
    }

    idea.title = title.trim();
    idea.summary = summary.trim();
    idea.description = description.trim();
    idea.tags =
      typeof tags === "string"
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag !== "")
        : Array.isArray(tags)
          ? tags
          : [];

    const updatedIdea = await idea.save();

    res.json(updatedIdea);
  } catch (err) {
    console.log(err.message);
    next(err);
  }
});

// @route        DELETE /api/ideas/:ideaId
// @description  Delete single idea
// @access       Public
router.delete("/:ideaId", protect, async (req, res, next) => {
  const { ideaId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(ideaId)) {
    res.status(404);
    throw new Error("Idea Not Found");
  }

  try {
    const idea = await Idea.findById(ideaId);
    if (!idea) {
      res.status(404);
      throw new Error("Idea Not Found");
    }
    // Check if user owns idea
    if (idea.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this idea.");
    }
    await idea.deleteOne();
    res.json({ message: "Idea deleted succesfully." });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

export default router;
