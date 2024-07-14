const express = require("express");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { v4 } = require("uuid");

const app = express();
const PORT = 9000;

app.use(express.json());

const ecsClient = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});

app.get("/", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

app.post("/deploy", async (req, res) => {
  const { repository_url } = req.body;
  const projectId =
    v4() || `${Date.now().now() + Math.random() * Math.random() * 100}`;
  console.log("projectId", projectId, repository_url);

  const config = {
    CLUSTER_NAME: "vercel-build-servers",
    TASK_NAME: "vercel-build-server",
  };

  // run the task on ECS cluster
  const command = new RunTaskCommand({
    cluster: config.CLUSTER_NAME,
    taskDefinition: config.TASK_NAME,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets: [
          "subnet-0b491b9792410c2f4",
          "subnet-0bb886607c3884c6d",
          "subnet-09394c5b3398b668e",
        ],
        securityGroups: ["sg-04fed703b8d0816c3"],
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "vercel-build-servers-image",
          environment: [
            { name: "repository_url", value: repository_url },
            { name: "PROJECT_ID", value: projectId },
          ],
        },
      ],
    },
  });

  await ecsClient.send(command);

  return res.json({
    status: "queued",
    data: { projectId, url: `http://${projectId}.localhost:8000` },
  });
});

app.listen(PORT, () => console.log(`running on: ${PORT}`));
