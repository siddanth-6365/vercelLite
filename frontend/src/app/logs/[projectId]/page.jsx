"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

const LogPage = ({ params }) => {
  const [messages, setMessages] = useState([]);
  const [isBuildCompleted, setIsBuildCompleted] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState("");
  const projectId = params.projectId;

  useEffect(() => {
    const socket = io("http://localhost:9005");
    const handleMessage = (msg) => {
      if (msg === `"All files uploaded successfully"`) {
        fetch(`http://localhost:9000/deployedUrl?projectId=${projectId}`)
          .then((res) => res.json())
          .then((data) => {
            setDeployedUrl(data.data.deployedUrl);
          });
        setIsBuildCompleted(true);
      }
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("connect", () => {
      socket.emit("subscribe", `logs:${projectId}`);
      socket.on("message", handleMessage);
    });
    socket.on("disconnect", () => console.log("socket disconnected"));

    return () => {
      socket.off("message", handleMessage);
      socket.disconnect();
    };
  }, [projectId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6"
      >
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          🚀 Build Logs
        </h1>
        <div className="h-64 overflow-y-auto bg-gray-900 text-green-300 font-mono p-4 rounded-lg">
          {messages.map((msg, idx) => (
            <div key={idx} className="mb-1">
              {msg}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center items-center">
          {!isBuildCompleted ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex flex-col items-center"
            >
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-2"></div>
              <span className="text-gray-700">Building...</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="text-green-500 mb-2 text-4xl">✅ Build Completed</div>
              <a
                href={deployedUrl}
                target="_blank"
                className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow hover:bg-indigo-700 transition"
              >
                Open Deployed Project
              </a>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LogPage;

/* Add this CSS to your global styles (e.g., globals.css) or extend Tailwind config:

.loader {
  border-top-color: #6366f1;
  animation: spin 1s ease-in-out infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
*/
