"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Use resolvedTheme (includes system preference)
  const current = resolvedTheme

  const toggleTheme = () => {
    setTheme(current === "light" ? "dark" : "light")
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {/* Sun Icon */}
      <Sun
        className={`h-[1.2rem] w-[1.2rem] transition-all
          ${current === "light" ? "rotate-0 scale-100" : "-rotate-90 scale-0"}
        `}
      />

      {/* Moon Icon */}
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all
          ${current === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"}
        `}
      />

      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
