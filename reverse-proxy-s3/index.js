const express = require("express");
const config = require("./config.json");
const httpProxy = require("http-proxy");
const axios = require("axios");

const app = express();
const PORT = 8000;

const S3_BASE = config.S3_BASE;
const API_URL = config.NODE_API_SERVER;

const proxy = httpProxy.createProxy();

// All incoming requests go through this handler
app.use(async (req, res) => {
  try {
    // 1) Extract subdomain
    const host = req.headers.host.split(":")[0]; // e.g. "myapp.localtest.me"
    const sub = host.split(".")[0]; // e.g. "myapp"

    // 2) Ask the API to resolve it → { buildId }
    const { data } = await axios.get(`${API_URL}/domainMappings/resolve/${sub}`);
    const { buildId } = data;

    // 3) Rewrite URL so "/" → "/index.html"
    req.url = req.url === "/" ? "/index.html" : req.url;

    // 4) Proxy into S3
    const target = `${S3_BASE}/${buildId}`;
    proxy.web(req, res, { target, changeOrigin: true });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).send("Site not found");
    }
    console.error("Proxy error:", err);
    res.status(502).send("Bad gateway");
  }
});

app.listen(PORT, () =>
  console.log(`🔀 Reverse proxy running on http://localhost:${PORT}`)
);
