"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render dynamic content on server
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(newTheme)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeToggle}
      className="h-9 w-9 relative overflow-hidden"
    >
      <Sun className={`h-4 w-4 transition-all ${
        theme === "light" ? "rotate-0 scale-100" : "-rotate-90 scale-0"
      }`} />
      <Moon className={`absolute inset-0 h-4 w-4 transition-all ${
        theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"
      }`} />
      <Monitor className={`absolute inset-0 h-4 w-4 transition-all ${
        theme === "system" ? "rotate-0 scale-100" : "rotate-90 scale-0"
      }`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}