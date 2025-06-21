const express = require("express");
const cors = require("cors");
const config = require("../config.json");
const initSocket = require("./socket");
const initRedis = require("./services/redisSubscriber");

const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");
const deploymentRoutes = require("./routes/deployments");
const logRoutes = require("./routes/deploymentLogs");
const domainRoutes = require("./routes/domainMappings");
const analyticsRoutes = require("./routes/analytics");

const app = express();
app.use(cors(), express.json());

app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/deployments", deploymentRoutes);
app.use("/logs", logRoutes);
app.use("/domainMappings", domainRoutes);
app.use("/analytics", analyticsRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Hello human!" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// start HTTP + Socket.IO + Redis
const PORT = 9000;
const httpServer = app.listen(PORT, () =>
  console.log(`🚀 HTTP listening on ${PORT}`)
);

const io = initSocket(httpServer);
initRedis(io, config.redisUrl);