import express from "express";
import Idea from "../models/Idea.js";
import mongoose from "mongoose";

const router = express.Router();

// @route        GET /api/ideas
// @description  Get all ideas
// @access       Public
router.get("/", async (req, res, next) => {
  try {
    const ideas = await Idea.find();
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
router.post("/", async (req, res, next) => {
  try {
    const { title, summary, description, tags } = req.body;

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
router.put("/:ideaId", async (req, res, next) => {
  const { ideaId } = req.params;

  try {
    const { title, summary, description, tags } = req.body;

    if (!title?.trim() || !summary?.trim() || !description?.trim()) {
      res.status(400);
      throw new Error("Title, summary and description are required!");
    }

    const updatedIdea = await Idea.findByIdAndUpdate(
      ideaId,
      {
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
      },
      { new: true, runValidators: true },
    );

    if (!updatedIdea) {
      res.status(404);
      throw new Error("Idea Not Found");
    }

    res.json(updatedIdea);
  } catch (err) {
    console.log(err.message);
    next(err);
  }
});

// @route        DELETE /api/ideas/:ideaId
// @description  Delete single idea
// @access       Public
router.delete("/:ideaId", async (req, res, next) => {
  const { ideaId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(ideaId)) {
    res.status(404);
    throw new Error("Idea Not Found");
  }

  try {
    const idea = await Idea.findByIdAndDelete(ideaId);
    if (!idea) {
      res.status(404);
      throw new Error("Idea Not Found");
    }
    res.json({ message: "Idea deleted succesfully." });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

export default router;
