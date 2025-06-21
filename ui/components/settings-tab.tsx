"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Globe, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DomainMapping {
  id: string
  domain: string
  projectId: string
}

interface SettingsTabProps {
  projectId: string
}

export function SettingsTab({ projectId }: SettingsTabProps) {
  const [domains, setDomains] = useState<DomainMapping[]>([])
  const [newDomain, setNewDomain] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL

  const fetchDomains = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/domainMappings?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setDomains(data)
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDomains()
  }, [projectId])

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain.trim()) return

    setIsAdding(true)
    try {
      const response = await fetch(`${BACKEND_URL}/domainMappings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          domain: newDomain.trim(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Custom domain added successfully!",
        })
        setNewDomain("")
        fetchDomains()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.message || "Failed to add domain",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while adding domain",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveDomain = async (domainId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/domainMappings/${domainId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Domain removed successfully!",
        })
        fetchDomains()
      } else {
        toast({
          title: "Error",
          description: "Failed to remove domain",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while removing domain",
        variant: "destructive",
      })
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
          <CardTitle>Custom Domains</CardTitle>
          <CardDescription>Configure custom domains for your project deployments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddDomain} className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="domain" className="sr-only">
                Domain
              </Label>
              <Input id="domain" placeholder="myapp" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
              <p className="text-sm text-gray-500 mt-1">
                Enter a subdomain prefix (e.g., "myapp" for myapp.vercelite.com)
              </p>
            </div>
            <Button type="submit" disabled={isAdding}>
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? "Adding..." : "Add Domain"}
            </Button>
          </form>

          {domains.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Active Domains</h4>
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{domain.domain}.{PROXY_URL}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`http://${domain.domain}.${PROXY_URL}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRemoveDomain(domain.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production URL</CardTitle>
          <CardDescription>Your project's production URL based on custom domains or default deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-gray-500" />
              <span className="font-mono text-sm">
                {domains.length > 0
                  ? `https://${domains[0].domain}.${PROXY_URL}`
                  : "https://[buildId]." + PROXY_URL}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {domains.length > 0
                ? "Using custom domain"
                : "Using default deployment URL (will be available after first successful deployment)"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
