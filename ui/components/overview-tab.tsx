"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Rocket,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Calendar,
  Timer,
  GitCommit,
} from "lucide-react"
import { LiveLogsConsole } from "@/components/live-logs-console"
import { ArchivedLogsConsole } from "@/components/archived-logs-console"
import { useToast } from "@/hooks/use-toast"

interface Deployment {
  id: number
  buildId?: string
  status: "pending" | "running" | "success" | "failed"
  createdAt: string
  startedAt?: string
  finishedAt?: string
}

interface OverviewTabProps {
  projectId: string
}

export function OverviewTab({ projectId }: OverviewTabProps) {
  const [latest, setLatest] = useState<Deployment | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPolling, setIsPolling] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const { toast } = useToast()
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!
  const PROXY   = process.env.NEXT_PUBLIC_PROXY_URL!

  // Fetch the latest deployment (limit=1, most recent)
  const fetchLatest = async () => {
    try {
      const res = await fetch(
        `${BACKEND}/deployments?projectId=${projectId}&limit=1&sort=desc`
      )
      if (res.ok) {
        const [dep] = await res.json()
        setLatest(dep || null)
        // auto-poll if it's running
        if (dep?.status === "running") setIsPolling(true)
        else setIsPolling(false)
      }
    } catch {
      toast({ title: "Error", description: "Unable to load deployments", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Initial load + polling loop
  useEffect(() => {
    fetchLatest()
  }, [projectId])

  useEffect(() => {
    if (!isPolling) return
    const iv = setInterval(fetchLatest, 5000)
    return () => clearInterval(iv)
  }, [isPolling])

  // Kick off a new deployment
  const handleNew = async () => {
    setLoading(true)
    const res = await fetch(`${BACKEND}/deployments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: Number(projectId) }),
    })
    if (!res.ok) {
      toast({ title: "Error", description: "Failed to start deployment", variant: "destructive" })
      setLoading(false)
      return
    }
    const { id } = await res.json()
    setShowLogs(true)
    setIsPolling(true)
    toast({ title: "Deployment Started", description: "Building your project…" })
    // immediately fetch to get the new record
    await fetchLatest()
  }

  // While loading the very first time
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Rocket className="animate-spin w-8 h-8 text-gray-500" />
      </div>
    )
  }

  // If no deployment exists yet
  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Rocket className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No deployments yet</h3>
        <p className="text-center text-muted-foreground max-w-md">
          Click below to kick off your first build and deploy.
        </p>
        <Button onClick={handleNew} size="lg" className="bg-blue-600 text-white">
          <Rocket className="w-4 h-4 mr-2 animate-pulse" />
          Start Deployment
        </Button>
      </div>
    )
  }

  // Destructure the latest
  const { id, status, buildId, createdAt, startedAt, finishedAt } = latest

  // Status styling config
  const getStatusConfig = (s: string) => {
    switch (s) {
      case "success":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bg: "bg-green-50",
          border: "border-green-200",
          color: "text-green-600",
          badge: "bg-green-100 text-green-800",
        }
      case "failed":
        return {
          icon: <XCircle className="w-5 h-5" />,
          bg: "bg-red-50",
          border: "border-red-200",
          color: "text-red-600",
          badge: "bg-red-100 text-red-800",
        }
      case "running":
        return {
          icon: <Clock className="w-5 h-5 animate-spin" />,
          bg: "bg-blue-50",
          border: "border-blue-200",
          color: "text-blue-600",
          badge: "bg-blue-100 text-blue-800",
        }
      default:
        return {
          icon: <Rocket className="w-5 h-5" />,
          bg: "bg-gray-50",
          border: "border-gray-200",
          color: "text-gray-600",
          badge: "bg-gray-100 text-gray-800",
        }
    }
  }

  const cfg = getStatusConfig(status)
  const duration =
    startedAt && finishedAt
      ? Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000)
      : null

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={`${cfg.bg} ${cfg.border} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cfg.color}>{cfg.icon}</div>
              <div>
                <CardTitle className="text-xl">Latest Deployment</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={cfg.badge}>{status.toUpperCase()}</Badge>
                  {buildId && (
                    <span className="font-mono text-sm text-muted-foreground">
                      {buildId.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Visit link, only on success */}
              {status === "success" && buildId && (
                <Button asChild size="sm">
                  <a
                    href={`http://${buildId}.${PROXY}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Live
                  </a>
                </Button>
              )}
              {/* Show/Hide logs */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogs((v) => !v)}
              >
                {showLogs ? "Hide Logs" : "View Logs"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {duration && (
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">{duration}s</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Deployment ID</p>
                <p className="text-sm text-muted-foreground font-mono">
                  #{id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      {showLogs && (
        <div className="space-y-4">
          {status === "running" ? (
            <LiveLogsConsole
              deploymentId={String(latest.id)}
              onClose={() => setShowLogs(false)}
            />
          ) : (
            <ArchivedLogsConsole
              deploymentId={String(latest.id)}
              onClose={() => setShowLogs(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}
