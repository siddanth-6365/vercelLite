const express = require("express");
const prisma = require("../prisma");
const router = express.Router();
const {
  createDeployment,
  fetchDeployedUrl,
  completeDeployment,
} = require("../controllers/deployController");

// Trigger a new deployment
router.post("/", createDeployment);

// deployed URL helper
router.get("/deployedUrl", fetchDeployedUrl);

// complete deployment
router.put("/:id/complete", completeDeployment);

// List deployments (optionally filter by project)
router.get("/", async (req, res, next) => {
  try {
    const sort = req.query.sort || "desc";
    const limit = Number(req.query.limit) || 10;

    const where = req.query.projectId
      ? { projectId: Number(req.query.projectId) }
      : {};
    const deployments = await prisma.deployment.findMany({
      where,
      orderBy: { createdAt: sort },
      take: limit,
    });
    res.json(deployments);
  } catch (err) {
    next(err);
  }
});

// Get deployment by ID
router.get("/:id", async (req, res, next) => {
  try {
    const deployment = await prisma.deployment.findUnique({
      where: { id: Number(req.params.id) },
      include: { logs: true },
    });
    res.json(deployment);
  } catch (err) {
    next(err);
  }
});

// Update status, finishedAt, etc.
router.put("/:id", async (req, res, next) => {
  try {
    const { status, startedAt, finishedAt } = req.body;
    const updated = await prisma.deployment.update({
      where: { id: Number(req.params.id) },
      data: { status, startedAt, finishedAt },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete deployment
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.deployment.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
