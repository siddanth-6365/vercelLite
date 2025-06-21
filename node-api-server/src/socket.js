const { Server } = require("socket.io");

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });

    socket.on("subscribe", (channel) => {
      console.log(`Subscribed to ${channel}`);
      socket.join(channel);
    });

    socket.on("unsubscribe", (channel) => {
      console.log(`Unsubscribed from ${channel}`);
      socket.leave(channel);
    });
  });

  return io;
}

module.exports = initSocket;
