const Redis = require("ioredis");
const prisma = require("../prisma");

function initRedis(io, redisUrl) {
  const client = new Redis(redisUrl);
  client.psubscribe("logs:*");

  const buffers = {};

  async function flush(deploymentId) {
    const batch = buffers[deploymentId];
    if (!batch || batch.length === 0) return;

    try {
      await prisma.deploymentLog.createMany({
        data: batch.map(({ level, text, loggedAt }) => ({
          deploymentId: Number(deploymentId),
          logLevel: level,
          message: text,
          loggedAt,
        })),
        skipDuplicates: true,
      });
    } catch (e) {
      console.error("Error writing logs batch:", e);
    } finally {
      buffers[deploymentId] = [];
    }
  }

  // Periodic flush (every 10s)
  setInterval(() => {
    for (const deploymentId of Object.keys(buffers)) {
      flush(deploymentId);
    }
  }, 10_000);

  client.on("pmessage", (_pattern, channel, raw) => {
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    const { deploymentId, level, text, timestamp } = payload;
    const when = new Date(timestamp);

    // 1) Broadcast only to sockets in room `logs:<deploymentId>`
    io.to(channel).emit("log", { level, text, timestamp: when });

    // 2) Buffer for bulk insert
    buffers[deploymentId] = buffers[deploymentId] || [];
    buffers[deploymentId].push({ level, text, loggedAt: when });

    // If too many queued, flush immediately
    if (buffers[deploymentId].length >= 100) {
      flush(deploymentId);
    }
  });

  console.log("🔔 Log processor subscribed to Redis pattern logs:*");
}

module.exports = initRedis;
