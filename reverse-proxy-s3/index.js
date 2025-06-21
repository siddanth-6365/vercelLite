const express = require("express");
const httpProxy = require("http-proxy");
const axios = require("axios");
const geoip = require("geoip-lite");
const UAParser = require("ua-parser-js");
const config = require("./config.json");

const app = express();
const proxy = httpProxy.createProxyServer();

// DOMAIN RESOLUTION with in-memory cache
const domainCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function resolveBuildId(subdomain) {
  const now = Date.now();
  const entry = domainCache.get(subdomain);
  if (entry && now - entry.ts < CACHE_TTL) {
    return entry.buildId;
  }
  // hit your API, to get the buildId for the subdomain
  const resp = await axios.get(
    `${config.NODE_API_SERVER}/domainMappings/resolve/${subdomain}`
  );
  const { buildId, projectId } = resp.data;
  domainCache.set(subdomain, { buildId, projectId, ts: now });
  return buildId;
}

app.use(async (req, res, next) => {
  try {
    const host = req.headers.host.split(":")[0]; // e.g. "myapp.localtest.me"
    const sub = host.split(".")[0]; // e.g. "myapp"
    req.buildId = await resolveBuildId(sub); // attach for later
    req.projectId = domainCache.get(sub).projectId; // for analytics
    next();
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).send("Site not found");
    }
    console.error("Domain resolution error:", err.message);
    return res.status(502).send("Bad gateway");
  }
});

// FIRE-AND-FORGET ANALYTICS MIDDLEWARE
function trackAnalytics(req, res, next) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress).split(
    ","
  )[0] || "xxx";
  const geo = geoip.lookup(ip) || {};
  const ua = new UAParser(req.headers["user-agent"]).getResult();
  const referrer = req.headers["referer"] || "";
  console.log("ip", ip, "geo", geo, "referrer", referrer, "ua", ua);

  const event = {
    projectId: req.projectId,
    path: req.url,
    ip,
    country: geo.country,
    region: geo.region,
    city: geo.city,
    deviceType: ua.device.type,
    os: ua.os.name,
    browser: ua.browser.name,
    referrer,
  };

  axios
    .post(`${config.NODE_API_SERVER}/analytics/events`, event)
    .catch((err) => {
      // don’t crash the proxy if analytics fails
      console.error("Analytics error:", err.message);
    });

  next();
}

app.use(trackAnalytics);

// ——————————————————————————————————————————
// 3) PROXY TO S3
// ——————————————————————————————————————————
app.use((req, res) => {
  // rewrite root → index.html
  req.url = req.url === "/" ? "/index.html" : req.url;

  const target = `${config.S3_BASE}/${req.buildId}`;
  proxy.web(req, res, { target, changeOrigin: true }, (err) => {
    console.error("Proxy error:", err.message);
    res.status(502).send("Bad gateway");
  });
});

// ——————————————————————————————————————————
// 4) START
// ——————————————————————————————————————————
const PORT = 8000;
app.listen(PORT, () =>
  console.log(`Proxy running on http://localhost:${PORT}`)
);
