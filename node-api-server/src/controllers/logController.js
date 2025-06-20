const prisma = require("../prisma");

async function listLogsByDeployment(req, res, next) {
  try {
    const deploymentId = Number(req.params.id);
    const logs = await prisma.deploymentLog.findMany({
      where: { deploymentId },
      orderBy: { loggedAt: "asc" },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

module.exports = { listLogsByDeployment };
