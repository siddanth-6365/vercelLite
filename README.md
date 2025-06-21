<img width="1559" alt="Screenshot 2024-07-14 at 6 18 46 PM" src="https://github.com/user-attachments/assets/28e843b2-73cf-437b-ac2a-0234b8249c84">

## VercelLite: (Personal Project)

**Description:**

VercelLite is an serverless deployment platform inspired by vercel.com. It provides users to deploy frontend react applications directly from their Github repositories. The platform automates the build and deployment process, provides custom domain mapping, collects web analytics, and offers real-time build log streaming through socket connections.

**Tech Stack:**

* **Frontend:** Next.js (React, TypeScript, Tailwind CSS, Shadcn UI)
* **Backend:** Node.js (Express.js)
* **Database:** PostgreSQL (managed via Prisma)
* **Containerization & Deployment:** Docker, AWS ECS, ECR
* **Cloud Storage:** AWS S3
* **Real-time Messaging:** Redis Pub/Sub
* **Real-time Communication:** Socket.IO
* **Analytics:** GeoIP, UAParser, custom analytics service

**Main Features:**

1. **Automatic Build & Deployment:**

   * Users submit their Git repository URL.
   * Application is cloned and automatically built within Docker containers managed by AWS ECS.
   * Build artifacts are stored securely in AWS S3.

2. **Custom Domain Mapping:**

   * Users can assign custom domains/subdomains to their applications.
   * A reverse proxy routes incoming requests from these custom domains to the relevant S3-hosted builds.

3. **Real-time Build Logs:**

   * Real-time streaming of deployment logs via Redis Pub/Sub.
   * Client-side real-time log viewing through Socket.IO connections.

4. **Web Analytics:**

   * Tracks page views and detailed visitor information including geographic location, device type, browser, and operating system.
   * Provides aggregated insights and visual analytics.

5. **Persistent Data Storage:**

   * PostgreSQL for structured storage of projects, deployments, domain mappings, and analytics data.
   * Efficient querying and summarization through Prisma ORM.

**Technical Workflow:**

* **Git URL Submission:** Frontend collects the repository URL and deployment configurations.
* **Containerized Build:** Backend triggers Docker container builds, managed through AWS ECS and ECR.
* **Artifact Storage:** Successful build outputs are uploaded to AWS S3 for reliable storage and serving.
* **Domain Mapping:** User-defined custom domains are mapped via a Node.js reverse proxy service.
* **Real-time Log Streaming:** Deployment logs are published to Redis and streamed via Socket.IO to connected clients.
* **Web Analytics Collection:** Middleware captures user interactions, enriches data via GeoIP and UAParser, and stores in PostgreSQL.

**YouTube Demo:**

* [Watch the project demo(old version's)](https://youtu.be/hsuV1CAn7SQ)