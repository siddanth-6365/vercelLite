"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Pause, Play, Download } from "lucide-react"
import { io, type Socket } from "socket.io-client"

interface LogEntry {
  level: "info" | "error" | "warn" | "debug"
  text: string
  timestamp: string
}

interface LiveLogsConsoleProps {
  deploymentId: string
  onClose: () => void
}

export function LiveLogsConsole({ deploymentId, onClose }: LiveLogsConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const socket = io("http://localhost:9005")
    socketRef.current = socket

    socket.on("connect", () => {
      setIsConnected(true)
      socket.emit("subscribe", `logs:${deploymentId}`)
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    socket.on("message", (payload: LogEntry) => {
      if (!isPaused) {
        setLogs((prevLogs) => [...prevLogs, payload])
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [deploymentId, isPaused])

  useEffect(() => {
    if (!isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, isPaused])

  const getLogColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-400"
      case "warn":
        return "text-yellow-400"
      case "info":
        return "text-blue-400"
      case "debug":
        return "text-gray-400"
      default:
        return "text-gray-300"
    }
  }

  const downloadLogs = () => {
    const logText = logs.map((log) => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.text}`).join("\n")

    const blob = new Blob([logText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `deployment-${deploymentId}-logs.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          Live Build Logs
          <span className="ml-2 text-sm font-normal text-gray-500">
            {isConnected ? (
              <span className="text-green-500">● Connected</span>
            ) : (
              <span className="text-red-500">● Disconnected</span>
            )}
          </span>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadLogs}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">Waiting for logs...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500 text-xs">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
                <span className={`font-semibold ${getLogColor(log.level)}`}>{log.level.toUpperCase()}:</span>{" "}
                <span className="text-gray-300">{log.text}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
        {isPaused && (
          <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            Logs are paused. Click Resume to continue receiving updates.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
