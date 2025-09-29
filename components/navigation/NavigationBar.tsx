"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/layout/ModeToggle"
import UserMenu from "@/components/navigation/UserMenu"
import ConnectionStatus from "@/components/system/ConnectionStatus"
import { useRouter, useSearchParams } from "next/navigation"

interface NavigationBarProps {
  variant?: "title" | "back"
  title?: string
  onBack?: () => void
}

export default function NavigationBar({
  variant,
  title,
  onBack,
}: NavigationBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Auto-detect if we're in a project view
  const projectId = searchParams.get('project')
  const isProjectView = !!projectId

  // Use provided variant or auto-detect
  const actualVariant = variant || (isProjectView ? 'back' : 'title')
  const actualTitle = title || 'Done and Done'

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      // Default back behavior - go to home
      router.push('/')
    }
  }

  return (
    <nav className="bg-background/95">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side - Title or Back button */}
        <div className="flex items-center">
          {actualVariant === "title" && (
            <h1 className="text-2xl font-semibold text-foreground">{actualTitle}</h1>
          )}
          {actualVariant === "back" && (
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
          <ConnectionStatus />
          <UserMenu />
          <ModeToggle />
        </div>
      </div>
    </nav>
  )
}
