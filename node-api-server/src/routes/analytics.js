const express = require("express");
const prisma = require("../prisma");
const router = express.Router();

router.post("/events", async (req, res, next) => {
  try {
    const {
      projectId,
      path,
      ip,
      country,
      region,
      city,
      deviceType,
      os,
      browser,
    } = req.body;
    
    await prisma.analyticsEvent.create({
      data: {
        projectId,
        path,
        ip,
        country,
        region,
        city,
        deviceType,
        os,
        browser,
      },
    });
    
    const today = new Date().toISOString();

    await prisma.analyticsSummary.upsert({
      where: { projectId_date: { projectId, date: today } },
      create: { projectId, date: today, views: 1, uniqueIPs: 1 },
      update: {
        views: { increment: 1 },
        // uniqueIPs: could use a Redis SET to track per-day
      },
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
