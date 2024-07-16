const express = require("express");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { v4 } = require("uuid");
const config = require("./config.json");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const app = express();
const PORT = 9000;

app.use(express.json());

const ecsClient = new ECSClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const RedisClient = new Redis(config.redisUrl); // this is for subscriber of logs, publishe by build-servers

const io = new Server({ cors: "*" });

io.listen(9005, () => console.log("io server on 9005"));

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

const reverseProxyUrl = "localhost:8000";

async function initRedisSubscribe() {
  console.log("Redis Subscribed to logs");
  RedisClient.psubscribe("logs:*"); // subscribe to logs with pattern of log: since we are publishing with key has logs:projectId
  RedisClient.on("pmessage", (pattern, channel, message) => {
    console.log("message :", message);
    io.to(channel).emit("message", message); // can listen in message event
  });
}

app.get("/", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

app.post("/deploy", async (req, res) => {
  const { repository_url, rootDirectory } = req.body;
  if (rootDirectory == "/") {
    rootDirectory = "";
  }
  
  const projectId =
    v4() || `${Date.now().now() + Math.random() * Math.random() * 100}`;

  // run the task on ECS cluster
  const command = new RunTaskCommand({
    cluster: config.aws.CLUSTER_NAME,
    taskDefinition: config.aws.TASK_NAME,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets: config.aws.subnets,
        securityGroups: config.aws.securityGroups,
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "vercel-build-servers-image",
          environment: [
            { name: "repository_url", value: repository_url },
            { name: "PROJECT_ID", value: projectId },
            { name: "ROOT_DIRECTORY", value: rootDirectory },
          ],
        },
      ],
    },
  });

  await ecsClient.send(command);

  return res.json({
    data: { projectId, url: `http://${projectId}.${reverseProxyUrl}` },
    status: "Queued",
  });
});

initRedisSubscribe();

app.listen(PORT, () => console.log(`running on: ${PORT}`));
