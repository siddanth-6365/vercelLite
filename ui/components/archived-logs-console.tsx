// components/archived-logs-console.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Download, Maximize2, Minimize2, Copy, Archive } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LogEntry {
    id: number
    logLevel: "info" | "warn" | "error" | "debug"
    message: string
    loggedAt: string
}

interface ArchivedLogsConsoleProps {
    deploymentId: string
    onClose: () => void
}

export function ArchivedLogsConsole({
    deploymentId,
    onClose,
}: ArchivedLogsConsoleProps) {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const { toast } = useToast()
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const resp = await fetch(
                    `${BACKEND}/logs/by-deployment/${deploymentId}`
                )
                if (!resp.ok) throw new Error("Failed to fetch archived logs")
                const data = await resp.json()
                setLogs(data)
            } catch (err: any) {
                console.error(err)
                toast({
                    title: "Error",
                    description: err.message,
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }
        fetchLogs()
    }, [deploymentId, BACKEND, toast])

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
        const text = logs
            .map(
                (log) =>
                    `[${new Date(log.loggedAt).toLocaleTimeString()}] ${log.logLevel.toUpperCase()}: ${log.message}`
            )
            .join("\n")
        const blob = new Blob([text], { type: "text/plain" })
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
        const text = logs
            .map(
                (log) =>
                    `[${new Date(log.loggedAt).toLocaleTimeString()}] ${log.logLevel.toUpperCase()}: ${log.message}`
            )
            .join("\n")
        navigator.clipboard.writeText(text)
        toast({
            title: "Copied!",
            description: "Archived logs copied to clipboard",
        })
    }

    return (
        <Card
            className={`w-full transition-all duration-300 ${isFullscreen ? "fixed inset-4 z-50" : ""
                }`}
        >
            <CardHeader className="flex flex-row  items-center justify-between pb-2 border-b">
                <div className="flex  items-center justify-center space-x-4">
                    <Archive className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-lg font-semibold">
                        Build Logs
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                        Deployment #{deploymentId}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyLogs}
                        disabled={logs.length === 0 || isLoading}
                    >
                        <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadLogs}
                        disabled={logs.length === 0 || isLoading}
                    >
                        <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="h-4 w-4" />
                        ) : (
                            <Maximize2 className="h-4 w-4" />
                        )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div
                    className={`bg-gray-950 dark:bg-gray-900 font-mono text-sm overflow-y-auto ${isFullscreen ? "h-[calc(100vh-8rem)]" : "h-96"
                        }`}
                >
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-2" />
                                <p>Loading archived logs…</p>
                            </div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-gray-500">
                            <div className="text-center">
                                <Archive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No logs available for this deployment</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 space-y-1">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start space-x-3 hover:bg-gray-800/50 px-2 py-1 rounded"
                                >
                                    <span className="text-xs text-gray-500 font-mono shrink-0 mt-0.5">
                                        {new Date(log.loggedAt).toLocaleTimeString()}
                                    </span>
                                    <span
                                        className={`font-semibold text-xs shrink-0 mt-0.5 ${getLogColor(
                                            log.logLevel
                                        )}`}
                                    >
                                        {log.logLevel.toUpperCase()}:
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-200 break-all">
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
