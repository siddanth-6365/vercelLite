"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { LogOut, Zap, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

export function Navbar() {
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r  rounded-lg">
                <Zap className="h-5 w-5 text-dark dark:text-white" />
              </div>
              <span className="text-2xl font-bold dark:text-white">
                VercelLite
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
