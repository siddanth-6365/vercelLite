const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const mime = require("mime-types");
const Redis = require("ioredis");
const config = require("./config.json");
const axios = require("axios");
dotenv.config();

const s3Client = new S3Client({
  region: config.aws.s3.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const PROJECT_ID = process.env.PROJECT_ID;
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;
const NODE_API_URL = config.nodeApiUrl;
const RedisClient = new Redis(config.redisUrl);

async function publishMessage({ level, text }) {
  await RedisClient.publish(
    `logs:${DEPLOYMENT_ID}`,
    JSON.stringify({
      deploymentId: DEPLOYMENT_ID,
      timestamp: new Date().toISOString(),
      level, // "info", "warn", "error", or "debug"
      text, // the actual log line
    })
  );
}

async function notifyDeployment(status) {
  try {
    await axios.put(`${NODE_API_URL}/deployments/${DEPLOYMENT_ID}/complete`, {
      status,
      finishedAt: new Date().toISOString(),
    });
    console.log(`Deployment ${DEPLOYMENT_ID} marked as ${status}`);
  } catch (err) {
    console.error("Failed to notify deployment status:", err.message);
  }
}

async function init() {
  // this directory is where the cloned files will be saved
  const outDir = path.join(__dirname, "output");

  publishMessage({ level: "info", text: "Building project ..." });
  const buildProcess = exec(`cd ${outDir} && npm install && npm run build`);

  buildProcess.stdout.on("data", (data) => {
    console.log("Data :", data.toString());
    publishMessage({ level: "info", text: data.toString() });
  });

  buildProcess.stdout.on("error", (error) => {
    console.error("Error:", error.toString());
    publishMessage({ level: "error", text: error.toString() });
    notifyDeployment("failed");
    process.exit(1);
  });

  buildProcess.stdout.on("close", async () => {
    console.log("build completed");
    publishMessage({ level: "info", text: "Build completed" });

    // NEW: detect which output folder was produced
    const possibleDirs = ["dist", "build", "out"];
    let buildDir = null;

    for (const dir of possibleDirs) {
      const candidate = path.join(outDir, dir);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        buildDir = candidate;
        console.log(`Found build output in "${dir}/"`);
        publishMessage({
          level: "info",
          text: `Using output directory: ${dir}`,
        });
        break;
      }
    }

    if (!buildDir) {
      const msg = `No build output directory found (looked for: ${possibleDirs.join(
        ", "
      )}).`;
      console.error(msg);
      await publishMessage({ level: "error", text: msg });
      await notifyDeployment("failed");
      process.exit(1);
    }

    const distFolderFiles = fs.readdirSync(buildDir, { recursive: true });

    for (let file of distFolderFiles) {
      const filePath = path.join(buildDir, file);
      // check if the file is a directory, if it is, skip it
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading file: ", filePath);
      publishMessage({ level: "info", text: `Uploading file: ${filePath}` });

      const fileBody = fs.createReadStream(filePath);

      const command = new PutObjectCommand({
        Bucket: config.aws.s3.bucket,
        Key: `_buildOutputs/${PROJECT_ID}/${file}`,
        Body: fileBody,
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
      console.log("file uploaded");
      publishMessage({ level: "info", text: `${filePath} File uploaded` });
    }
    console.log("All files uploaded successfully");
    publishMessage({ level: "info", text: "All files uploaded successfully" });
    await notifyDeployment("success");
    process.exit(0);
  });
}
init();
