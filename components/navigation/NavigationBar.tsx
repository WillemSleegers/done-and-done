"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/layout/ModeToggle"
import UserMenu from "@/components/navigation/UserMenu"

interface NavigationBarProps {
  variant: "title" | "back"
  title?: string
  backPath?: string
}

export default function NavigationBar({
  variant,
  title,
  backPath = "/",
}: NavigationBarProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push(backPath)
  }

  return (
    <nav className="bg-background/95">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side - Title or Back button */}
        <div className="flex items-center">
          {variant === "title" && title && (
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          )}
          {variant === "back" && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground p-2 -ml-2 rounded-lg hover:bg-muted"
            >
              <ArrowLeft size={20} />
              <span>Back to Projects</span>
            </Button>
          )}
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-2">
          <UserMenu />
          <ModeToggle />
        </div>
      </div>
    </nav>
  )
}
