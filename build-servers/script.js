const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const mime = require("mime-types");
const Redis = require("ioredis");
const config = require("./config.json");

dotenv.config();

const s3Client = new S3Client({
  region: config.aws.s3.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const PROJECT_ID = process.env.PROJECT_ID;
const RedisClient = new Redis(config.redisUrl);

const publishMessage = async (message) => {
  await RedisClient.publish(`logs:${PROJECT_ID}`, JSON.stringify(message));
};

async function init() {
  // this directory is where the cloned files will be saved
  const outDir = path.join(__dirname, "output");

  publishMessage("Building project ...");
  const process = exec(`cd ${outDir} && npm install && npm run build`);

  process.stdout.on("data", (data) => {
    console.log("Data :", data.toString());
    publishMessage(data.toString());
  });

  process.stdout.on("error", (error) => {
    console.error("Error:", error.toString());
    publishMessage(`Error: ${error.toString()}`);
  });

  process.stdout.on("close", async () => {
    console.log("build completed");
    publishMessage("Build completed");
    // the dist folder be will created after building your application that contains the optimized and production-ready files for deployment.
    const buildDir = path.join(outDir, "dist");
    const distFolderFiles = fs.readdirSync(buildDir, { recursive: true });

    for (let file of distFolderFiles) {
      const filePath = path.join(buildDir, file);
      // check if the file is a directory, if it is, skip it
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading file: ", filePath);
      publishMessage(`Uploading file: ${filePath}`);

      const fileBody = fs.createReadStream(filePath);

      const command = new PutObjectCommand({
        Bucket: config.aws.s3.bucket,
        Key: `_buildOutputs/${PROJECT_ID}/${file}`,
        Body: fileBody,
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
      console.log("file uploaded");
      publishMessage(`${filePath} File uploaded`);
    }
    console.log("All files uploaded successfully");
    publishMessage("All files uploaded successfully");
  });
}
init();
