const prisma = require("../prisma");
const { triggerDeployment, getDeployedUrl } = require("../services/ecs");

async function createDeployment(req, res, next) {
  try {
    //TODO: currently we are not using branch and commitHash
    const { projectId } = req.body;

    // 1) fetch project details
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const repositoryUrl = project.gitUrl;
    const rootDirectory = project.rootDirectory || "/";

    const deployment = await prisma.deployment.create({
      data: {
        projectId: Number(projectId),
        triggeredById: Number(project.userId),
      },
    });

    const { buildId } = await triggerDeployment({
      repositoryUrl,
      rootDirectory,
      deploymentId: deployment.id,
    });

    console.log("Deployment triggered successfully with buildId:", buildId);
    // 4) respond with both our DB record and the public URL
    res.status(201).json({
      data: {
        deployment,
        deployedUrl: getDeployedUrl(buildId),
      },
      status: "Running",
    });
  } catch (err) {
    next(err);
  }
}

async function fetchDeployedUrl(req, res, next) {
  try {
    const url = getDeployedUrl(req.query.buildId);
    res.json({ data: { deployedUrl: url } });
  } catch (err) {
    next(err);
  }
}

async function completeDeployment(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status, finishedAt } = req.body;

    // validate status…
    if (!["success", "failed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updated = await prisma.deployment.update({
      where: { id },
      data: {
        status,
        finishedAt,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { createDeployment, fetchDeployedUrl, completeDeployment };
