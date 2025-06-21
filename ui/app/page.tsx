"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function HomePage() {
  const { userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (userId) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [userId, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
    </div>
  )
}
