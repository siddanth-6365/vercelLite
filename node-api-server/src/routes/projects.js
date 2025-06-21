const express = require("express");
const prisma = require("../prisma");
const router = express.Router();

// Create project
router.post("/", async (req, res, next) => {
  try {
    const { userId, name, gitUrl, defaultBranch, rootDirectory } = req.body;
    const project = await prisma.project.create({
      data: { userId: Number(userId), name, gitUrl, defaultBranch, rootDirectory },
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// List all projects
router.get("/", async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// Get project by id
router.get("/:id", async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: Number(req.params.id) },
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// Update project
router.put("/:id", async (req, res, next) => {
  try {
    const { name, gitUrl, defaultBranch, rootDirectory } = req.body;
    const project = await prisma.project.update({
      where: { id: Number(req.params.id) },
      data: { name, gitUrl, defaultBranch, rootDirectory },
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// Delete project
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
