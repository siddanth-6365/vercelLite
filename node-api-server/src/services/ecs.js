const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { v4: uuidv4 } = require("uuid");
const config = require("../../config.json");
const prisma = require("../prisma");

const ecsClient = new ECSClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

async function triggerDeployment({
  repositoryUrl,
  rootDirectory,
  deploymentId,
}) {
  const buildId = uuidv4(); // this is not the project id but the id of the ECS task for this deployment
  const cmd = new RunTaskCommand({
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
          name: "vercellite-build-server",
          environment: [
            { name: "repository_url", value: repositoryUrl },
            { name: "PROJECT_ID", value: buildId },
            { name: "ROOT_DIRECTORY", value: rootDirectory },
            { name: "DEPLOYMENT_ID", value: String(deploymentId) },
          ],
        },
      ],
    },
  });

  await ecsClient.send(cmd);

  await prisma.deployment.update({
    where: { id: Number(deploymentId) },
    data: { status: "running", buildId: buildId },
  });

  return {
    buildId,
    reverseProxyUrl: config.reverseProxyUrl,
  };
}

function getDeployedUrl(projectId) {
  return `http://${projectId}.${config.reverseProxyUrl}`;
}

module.exports = { triggerDeployment, getDeployedUrl };
