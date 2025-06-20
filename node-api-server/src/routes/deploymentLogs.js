const express = require("express");
const prisma = require("../prisma");
const router = express.Router();

// Add a log entry
router.post("/", async (req, res, next) => {
  try {
    const { deploymentId, logLevel, message, loggedAt } = req.body;
    const log = await prisma.deploymentLog.create({
      data: { deploymentId, logLevel, message, loggedAt },
    });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

// Get logs for a deployment
router.get("/by-deployment/:id", async (req, res, next) => {
  try {
    const logs = await prisma.deploymentLog.findMany({
      where: { deploymentId: Number(req.params.id) },
      orderBy: { loggedAt: "asc" },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
