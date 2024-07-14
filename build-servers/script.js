const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const mime = require("mime-types");

dotenv.config();
const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  // this directory is where the cloned files will be saved
  const outDir = path.join(__dirname, "output");

  // this process will execute the following commands
  const process = exec(`cd ${outDir} && npm install && npm run build`);

  process.stdout.on("data", (data) => {
    console.log("Data :", data.toString());
  });

  process.stdout.on("error", (error) => {
    console.error("Error:", error.toString());
  });

  // once the build is completed, we will upload the files to the S3 bucket
  process.stdout.on("close", async () => {
    console.log("build completed");
    // the dist folder be will created after building your application that contains the optimized and production-ready files for deployment.
    const buildDir = path.join(outDir, "dist");
    const distFolderFiles = fs.readdirSync(buildDir, { recursive: true });

    for (let file of distFolderFiles) {
      const filePath = path.join(buildDir, file);
      // check if the file is a directory, if it is, skip it
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading file: ", filePath);

      // here we are using mime-types to get the content type of the file
      // open & read the file
      const fileBody = fs.createReadStream(filePath);

      const command = new PutObjectCommand({
        Bucket: "siddanth-vercel-clone",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fileBody,
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
      console.log("file uploaded");
    }
    console.log("All files uploaded successfully");
  });
}
init();
