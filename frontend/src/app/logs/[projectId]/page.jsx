"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const Page = ({ params }) => {
  const [messages, setMessages] = useState([]);
  const [isBuildCompleted, setIsBuildCompleted] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState("");
  const projectId = params.projectId;

  useEffect(() => {
    const socket = io("http://localhost:9005");

    const handleMessage = (message) => {
      if (message == `"All files uploaded successfully"`) {
        const endpoint = `http://localhost:9000/deployedUrl?projectId=${projectId}`;
        fetch(endpoint)
          .then((res) => res.json())
          .then((data) => {
            setDeployedUrl(data.data.deployedUrl);
          });
        setIsBuildCompleted(true);
      }
      setMessages((prev) => [...prev, message]);
    };

    socket.on("connect", () => {
      socket.emit("subscribe", `logs:${projectId}`);
      socket.on("message", handleMessage);
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });

    // Cleanup on unmount
    return () => {
      socket.off("message", handleMessage);
      socket.disconnect();
    };
  }, [projectId]);

  return (
    <div className="text-center text-xl">
      logs:
      {messages.map((msg, index) => (
        <div key={index}>
          {msg} <br />
        </div>
      ))}
      {isBuildCompleted && (
        <>
          <div className="text-green-500 font-bold">Build Completed</div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
            <a href={deployedUrl} target="_blank">
              Open deployed Project
            </a>
          </button>
        </>
      )}
    </div>
  );
};

export default Page;
