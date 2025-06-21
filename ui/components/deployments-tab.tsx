"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { LiveLogsConsole } from "@/components/live-logs-console"
import { useToast } from "@/hooks/use-toast"

interface Deployment {
  id: string
  status: "pending" | "building" | "success" | "failed"
  createdAt: string
  duration?: number
  buildId?: string
}

interface DeploymentsTabProps {
  projectId: string
}

export function DeploymentsTab({ projectId }: DeploymentsTabProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeploying, setIsDeploying] = useState(false)
  const [activeDeploymentId, setActiveDeploymentId] = useState<string | null>(null)
  const { toast } = useToast()
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL

  const fetchDeployments = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/deployments?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setDeployments(data)
      }
    } catch (error) {
      console.error("Failed to fetch deployments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDeployments()
    const interval = setInterval(fetchDeployments, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [projectId])

  const handleNewDeployment = async () => {
    setIsDeploying(true)
    try {
      const response = await fetch(`${BACKEND_URL}/deployments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      })

      if (response.ok) {
        const deployment = await response.json()
        setActiveDeploymentId(deployment.id)
        fetchDeployments()
        toast({
          title: "Deployment Started",
          description: "Your deployment is now building...",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to start deployment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while starting deployment",
        variant: "destructive",
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "building":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "building":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Deployments</span>
            <Button onClick={handleNewDeployment} disabled={isDeploying}>
              <Rocket className="h-4 w-4 mr-2" />
              {isDeploying ? "Deploying..." : "New Deployment"}
            </Button>
          </CardTitle>
          <CardDescription>Deploy your project and view build logs in real-time</CardDescription>
        </CardHeader>
      </Card>

      {activeDeploymentId && (
        <LiveLogsConsole deploymentId={activeDeploymentId} onClose={() => setActiveDeploymentId(null)} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
        </CardHeader>
        <CardContent>
          {deployments.length === 0 ? (
            <div className="text-center py-8">
              <Rocket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No deployments yet</p>
              <p className="text-sm text-gray-500">Create your first deployment to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setActiveDeploymentId(deployment.id)}
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(deployment.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(deployment.status)}>{deployment.status}</Badge>
                        <span className="text-sm text-gray-600">{new Date(deployment.createdAt).toLocaleString()}</span>
                      </div>
                      {deployment.duration && (
                        <p className="text-sm text-gray-500 mt-1">Duration: {deployment.duration}s</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {deployment.status === "success" && deployment.buildId && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`http://${deployment.buildId}.${PROXY_URL}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Live
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
