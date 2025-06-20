const prisma = require("../prisma");

async function createDeploymentLog(deploymentId, level, text, timestamp) {
  await prisma.deploymentLog.create({
    data: {
      deploymentId: Number(deploymentId),
      logLevel: level,
      message: text,
      loggedAt: new Date(timestamp),
    },
  });
}

module.exports = { createDeploymentLog };
