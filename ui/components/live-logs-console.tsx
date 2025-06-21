"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Pause, Play, Download, Maximize2, Minimize2, Copy } from "lucide-react"
import { io, type Socket } from "socket.io-client"
import { useToast } from "@/hooks/use-toast"

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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL)
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
        return "text-red-400 dark:text-red-300"
      case "warn":
        return "text-yellow-400 dark:text-yellow-300"
      case "info":
        return "text-blue-400 dark:text-blue-300"
      case "debug":
        return "text-gray-400 dark:text-gray-500"
      default:
        return "text-gray-300 dark:text-gray-400"
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

  const copyLogs = () => {
    const logText = logs.map((log) => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.text}`).join("\n")
    navigator.clipboard.writeText(logText)
    toast({
      title: "Copied!",
      description: "Logs copied to clipboard",
    })
  }

  return (
    <Card className={`w-full transition-all duration-300 ${isFullscreen ? "fixed inset-4 z-50" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <CardTitle className="text-lg font-semibold">Live Build Logs</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</div>
        </div>
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
          <Button variant="outline" size="sm" onClick={copyLogs}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadLogs}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className={`bg-gray-950 dark:bg-gray-900 font-mono text-sm overflow-y-auto ${isFullscreen ? "h-[calc(100vh-8rem)]" : "h-96"}`}
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-4"></div>
                <p>Waiting for logs...</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-3 hover:bg-gray-800/50 px-2 py-1 rounded">
                  <span className="text-gray-500 text-xs font-mono shrink-0 mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`font-semibold text-xs shrink-0 mt-0.5 ${getLogColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-gray-300 dark:text-gray-200 break-all">{log.text}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
        {isPaused && (
          <div className="border-t bg-yellow-50 dark:bg-yellow-950 px-4 py-2">
            <div className="flex items-center space-x-2 text-sm text-yellow-800 dark:text-yellow-200">
              <Pause className="h-4 w-4" />
              <span>Logs are paused. Click Resume to continue receiving updates.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
