const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const PORT = 8000;

const AWS_BASE_PATH =
  "https://vercel-build-server-outputs.s3.amazonaws.com/_buildOutputs";

const proxy = httpProxy.createProxy();

app.use((req, res) => {
  // so here we are adding projectId as subdomain (eg : p2.vercelLite.com), since we are storing the dist files in s3 bucket with projectId in key
  const projectId = req.hostname.split(".")[0];

  const targetUrl = `${AWS_BASE_PATH}/${projectId}`;
  return proxy.web(req, res, { target: targetUrl, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  //  proxyReq event handler is used to modify the request before it is sent to the S3 bucket
  // why are we doing this because if i add index.html directly to the target url it is requesting to index.html/ (here / is added at the end) and aws s3 is not able to find the file since we stored the file without / at the end as key
  const url = req.url;
  if (url === "/") proxyReq.path += "index.html";
});

app.listen(PORT, () => console.log(` server running on: ${PORT}`));
