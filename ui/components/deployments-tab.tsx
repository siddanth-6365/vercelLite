"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Rocket,
  Clock,
  CheckCircle,
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

interface Props {
  projectId: string
}

export function DeploymentsTab({ projectId }: Props) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const { toast } = useToast()
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!
  const PROXY = process.env.NEXT_PUBLIC_PROXY_URL!
  const pollRef = useRef<number>()
  const [loading, setLoading] = useState(false)

  // Fetch all deployments
  const fetchAll = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND}/deployments?projectId=${projectId}`)
      if (res.ok) setDeployments(await res.json())
    } catch { }
    setLoading(false)
  }

  // Fetch single deployment
  const fetchOne = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND}/deployments/${id}`)
      if (!res.ok) return null
      return (await res.json()) as Deployment
    } catch {
      return null
    }
  }

  // Initial load
  useEffect(() => {
    fetchAll()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [projectId])

  // Start new
  const handleNew = async () => {
    setIsDeploying(true)
    const res = await fetch(`${BACKEND}/deployments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: Number(projectId) }),
    })
    if (!res.ok) {
      toast({
        title: "Error",
        description: "Failed to start deployment",
        variant: "destructive",
      })
      setIsDeploying(false)
      return
    }
    const { id } = await res.json()
    setActiveId(id)
    setIsPolling(true)
    toast({
      title: "Deployment Started",
      description: "Your project is being built...",
    })
    setIsDeploying(false)
  }

  // Poll only the active one
  useEffect(() => {
    if (!activeId || !isPolling) return
    const check = async () => {
      const d = await fetchOne(activeId)
      if (d) {
        setDeployments((prev) => {
          const others = prev.filter((x) => x.id !== d.id)
          return [d, ...others]
        })
        if (d.status !== "running") {
          setIsPolling(false)
          clearInterval(pollRef.current!)
        }
      }
    }
    check()
    pollRef.current = window.setInterval(check, 5000)
    return () => {
      clearInterval(pollRef.current!)
      setIsPolling(false)
    }
  }, [activeId, isPolling])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "success":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          badge: "bg-green-100 text-green-800",
        }
      case "failed":
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          badge: "bg-red-100 text-red-800",
        }
      case "running":
        return {
          icon: <Clock className="w-4 h-4 animate-spin" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          badge: "bg-blue-100 text-blue-800",
        }
      default:
        return {
          icon: <Rocket className="w-4 h-4" />,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          badge: "bg-gray-100 text-gray-800",
        }
    }
  }

  return (
    <div className="space-y-6">
    
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Rocket className="w-16 h-16 mx-auto text-gray-400 mb-4 animate-bounce" />
            <p className="font-semibold mb-1">Loading deployments...</p>
            <p className="text-gray-500">
              Please wait while we load your deployments.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {deployments.length === 0 ? (
            <Card className="text-center py-12">
              <Rocket className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="font-semibold mb-1">No deployments yet</p>
              <p className="text-gray-500">
                Click “New Deployment” to get started.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {deployments.map((d) => {
                const conf = getStatusConfig(d.status)
                const duration =
                  d.startedAt && d.finishedAt
                    ? Math.round(
                      (new Date(d.finishedAt).getTime() -
                        new Date(d.startedAt).getTime()) /
                      1000
                    )
                    : null

                return (
                  <Card
                    key={d.id}
                    className={`cursor-pointer transition ${conf.bgColor}  border-l-4 dark:bg-gray-950 dark:border-gray-800 ${d.status === "success"
                      ? "border-l-green-500"
                      : d.status === "failed"
                        ? "border-l-red-500"
                        : d.status === "running"
                          ? "border-l-blue-500"
                          : "border-l-gray-300"
                      }`}
                    onClick={() => {
                      setActiveId(d.id === activeId ? null : d.id)
                      if (d.status === "running" && d.id !== activeId) {
                        setIsPolling(true)
                      } else {
                        setIsPolling(false)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`${conf.color} mt-1`}>{conf.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={conf.badge}>
                                {d.status.toUpperCase()}
                              </Badge>
                              {d.buildId && (
                                <span className="font-mono text-sm text-gray-600">
                                  {d.buildId.slice(0, 8)}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-500">
                                  {new Date(d.createdAt).toLocaleString()}
                                </span>
                              </div>
                              {duration && (
                                <div className="flex items-center space-x-2">
                                  <Timer className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-500">
                                    {duration}s
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <GitCommit className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-500">#{d.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {d.status === "success" && d.buildId && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={`http://${d.buildId}.${PROXY}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Visit
                            </a>
                          </Button>
                        )}
                      </div>

                      {/* Inline logs */}
                      {activeId === d.id && (
                        <div className="mt-4">
                          {d.status === "running" ? (
                            <LiveLogsConsole
                              deploymentId={String(d.id)}
                              onClose={() => setActiveId(null)}
                            />
                          ) : (
                            <ArchivedLogsConsole
                              deploymentId={String(d.id)}
                              onClose={() => setActiveId(null)}
                            />
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
