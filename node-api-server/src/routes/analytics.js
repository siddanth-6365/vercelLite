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

    if (path === "/" || path.endsWith(".html")) {
      const today = new Date().toISOString();
      await prisma.analyticsSummary.upsert({
        where: { projectId_date: { projectId, date: today } },
        create: { projectId, date: today, views: 1 },
        update: { views: { increment: 1 } },
      });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
// Helper: parse YYYY-MM-DD into Date at midnight UTC
function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// ————————————————
// 1) Daily summary endpoint
// GET /analytics/project/:projectId/summary
//    ?days=N
//    OR
//    ?from=YYYY-MM-DD&to=YYYY-MM-DD
// ————————————————
router.get("/project/:projectId/summary", async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    let fromDate, toDate;

    if (req.query.from && req.query.to) {
      // custom range
      fromDate = parseDate(req.query.from);
      toDate = parseDate(req.query.to);
    } else {
      // days window
      const days = Number(req.query.days) || 7;
      toDate = new Date(); // now
      fromDate = new Date();
      fromDate.setDate(toDate.getDate() - days + 1); // include today
    }

    // Set time to start of fromDate (00:00:00) and end of toDate (23:59:59.999)
    const startOfDay = new Date(fromDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(toDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch all summary rows within the date range
    const rows = await prisma.analyticsSummary.findMany({
      where: {
        projectId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { date: "asc" },
    });

    // Create a map of date strings to views for easier lookup
    const dateToViews = new Map();
    rows.forEach((row) => {
      const dateStr = row.date.toISOString().split("T")[0];
      dateToViews.set(dateStr, (dateToViews.get(dateStr) || 0) + row.views);
    });

    // Generate date range for the response
    const dates = [];
    const currentDate = new Date(startOfDay);
    while (currentDate <= endOfDay) {
      dates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create summary with all dates in range
    const summary = dates.map((dateStr) => ({
      date: dateStr,
      views: dateToViews.get(dateStr) || 0,
    }));

    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// ————————————————
// 2) Breakdown endpoint
// GET /analytics/project/:projectId/breakdown
//    ?days=N
//    OR
//    ?from=YYYY-MM-DD&to=YYYY-MM-DD
// ————————————————
router.get("/project/:projectId/breakdown", async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    let since;

    if (req.query.from) {
      // custom range
      since = parseDate(req.query.from);
      // we ignore req.query.to here for counting events >= since
    } else {
      // days window
      const days = Number(req.query.days) || 7;
      since = new Date();
      since.setDate(since.getDate() - days + 1);
    }

    // we'll only count events where path === "/" OR endsWith(".html")
    const pageViewFilter = {
      OR: [{ path: "/" }, { path: { endsWith: ".html" } }],
    };

    // 1) total events in window
    const total = await prisma.analyticsEvent.count({
      where: {
        projectId,
        createdAt: { gte: since },
        ...pageViewFilter,
      },
    });

    // 2) grouping helper
    const makeGroup = (field) =>
      prisma.analyticsEvent.groupBy({
        by: [field],
        where: { projectId, createdAt: { gte: since }, ...pageViewFilter },
        _count: { [field]: true },
        orderBy: { _count: { [field]: "desc" } },
      });

    const [byCountry, byOS, byBrowser, byDevice] = await Promise.all([
      makeGroup("country"),
      makeGroup("os"),
      makeGroup("browser"),
      makeGroup("deviceType"),
    ]);

    // 3) format into {key,count,percent}
    const fmt = (arr, keyName) =>
      arr.map((row) => ({
        key: row[keyName] || "Unknown",
        count: row._count[keyName],
        percent:
          total > 0 ? Math.round((row._count[keyName] / total) * 100) : 0,
      }));

    res.json({
      total,
      breakdown: {
        country: fmt(byCountry, "country"),
        os: fmt(byOS, "os"),
        browser: fmt(byBrowser, "browser"),
        deviceType: fmt(byDevice, "deviceType"),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
