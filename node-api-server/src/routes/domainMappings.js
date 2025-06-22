const express = require("express");
const prisma = require("../prisma");
const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { projectId, domain } = req.body;
    const mapping = await prisma.domainMapping.create({
      data: { projectId: Number(projectId), domain },
    });
    res.status(201).json(mapping);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const where = req.query.projectId
      ? { projectId: Number(req.query.projectId) }
      : {};
    const mappings = await prisma.domainMapping.findMany({ where });
    res.json(mappings);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.domainMapping.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Resolve a subdomain → buildId
// GET /api/domainMappings/resolve/:subdomain
router.get("/resolve/:subdomain", async (req, res, next) => {
  try {
    const sub = req.params.subdomain; // e.g. "myapp"
    // Try to find a custom mapping
    const mapping = await prisma.domainMapping.findUnique({
      where: { domain: sub },
    });
    let buildId, projectId;

    if (mapping) {
      // If mapped, get latest successful deployment for that project
      const latest = await prisma.deployment.findFirst({
        where: {
          projectId: mapping.projectId,
          status: "success",
        },
        orderBy: { createdAt: "desc" },
      });
      if (!latest?.buildId) {
        return res.status(404).json({ error: "No build found" });
      }
      buildId = latest.buildId;
      projectId = latest.projectId;
    } else {
      // Fallback: treat the subdomain itself as a buildId
      buildId = sub;
      const project = await prisma.deployment.findFirst({
        where: { buildId: sub },
      });
      projectId = project?.projectId;
    }

    res.json({ buildId, projectId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
