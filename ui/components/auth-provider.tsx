"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  userId: string | null
  login: (userId: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    setUserId(storedUserId)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ["/login", "/signup"]
      const isPublicPath = publicPaths.includes(pathname)

      if (!userId && !isPublicPath) {
        router.push("/login")
      } else if (userId && isPublicPath) {
        router.push("/dashboard")
      }
    }
  }, [userId, pathname, router, isLoading])

  const login = (newUserId: string) => {
    localStorage.setItem("userId", newUserId)
    setUserId(newUserId)
    router.push("/dashboard")
  }

  const logout = () => {
    localStorage.removeItem("userId")
    setUserId(null)
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return <AuthContext.Provider value={{ userId, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
