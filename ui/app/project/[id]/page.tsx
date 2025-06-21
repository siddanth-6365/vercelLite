"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { GitBranch, Folder, Globe } from "lucide-react"
import { DeploymentsTab } from "@/components/deployments-tab"
import { SettingsTab } from "@/components/settings-tab"
import { OverviewTab } from "@/components/overview-tab"
import { useToast } from "@/hooks/use-toast"
import { AnalyticsTab } from "@/components/analytics-tab"

interface Project {
  id: string
  name: string
  gitUrl: string
  defaultBranch: string
  rootDirectory: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
        const response = await fetch(`${BACKEND_URL}/projects/${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setProject(data)
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch project details",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Network error while fetching project",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  if (isLoading) {
    return (
      <div className="min-h-screen ">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen ">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project not found</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{project.name}</h1>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Repository:</span>
                  <span className="text-sm font-medium truncate">{project.gitUrl}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Branch:</span>
                  <Badge variant="secondary">{project.defaultBranch}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Root:</span>
                  <span className="text-sm font-medium">{project.rootDirectory}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab projectId={projectId} />
          </TabsContent>
          <TabsContent value="deployments">
            <DeploymentsTab projectId={projectId} />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab projectId={projectId} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
