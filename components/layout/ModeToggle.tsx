"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" className="size-9" tabIndex={5}>
        <Monitor className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const currentTheme = theme || "system"

  const toggleTheme = () => {
    switch (currentTheme) {
      case "light":
        setTheme("dark")
        break
      case "dark":
        setTheme("system")
        break
      case "system":
        setTheme("light")
        break
      default:
        setTheme("light")
        break
    }
  }

  const getIcon = () => {
    switch (currentTheme) {
      case "light":
        return <Sun className="h-[1.2rem] w-[1.2rem]" />
      case "dark":
        return <Moon className="h-[1.2rem] w-[1.2rem]" />
      case "system":
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />
      default:
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />
    }
  }

  const getLabel = () => {
    switch (currentTheme) {
      case "light":
        return "Switch to dark mode"
      case "dark":
        return "Switch to system mode"
      case "system":
        return "Switch to light mode"
      default:
        return "Toggle theme"
    }
  }

  return (
    <Button
      variant="outline"
      className="size-9"
      onClick={toggleTheme}
      title={getLabel()}
      tabIndex={5}
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  )
}