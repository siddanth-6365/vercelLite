"use client";
import React, { useState } from "react";
import { io } from "socket.io-client";

const Page = ({ params }) => {
  const [message, setMessage] = useState("");
  const projectId = params.projectId;
  const socket = io("http://localhost:9005");

  if (projectId) {
    console.log("subscribing to logs:", projectId);
    socket.emit("subscribe", `logs:${projectId}`);
  }

  socket.on("message", (message) => {
    setMessage(message);
  });

  return (
    <div className="text-center text-xl">
      logs:
      {message}
    </div>
  );
};

export default Page;
