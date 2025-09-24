"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { useProjectStore } from "@/lib/store/projectStore"
import type { Project } from "@/lib/services/syncService"
import AuthGuard from "@/components/auth/AuthGuard"
import NavigationBar from "@/components/navigation/NavigationBar"
import SyncStatus from "@/components/system/SyncStatus"
import ProjectGrid from "@/components/project/ProjectGrid"
import ProjectTodoView from "@/components/project/ProjectTodoView"
import LoadingScreen from "@/components/ui/LoadingScreen"

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getProject, projects, isLoading } = useProjectStore()

  const projectParam = searchParams.get('project')
  const isNewProject = searchParams.get('new') === 'true'

  // Use state to store the selected project and track if we've processed the lookup
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [hasProcessedLookup, setHasProcessedLookup] = useState(false)

  // Update selected project whenever projectParam or projects change
  useEffect(() => {
    if (!projectParam) {
      setSelectedProject(null)
      setHasProcessedLookup(true)
      return
    }

    // Only process lookup if we have data loaded or aren't loading
    if (projects.length > 0 || !isLoading) {
      const found = getProject(projectParam)
      setSelectedProject(found || null)
      setHasProcessedLookup(true)
    } else {
      setHasProcessedLookup(false)
    }
  }, [projectParam, projects, isLoading, getProject])

  // Show loading if we haven't finished processing the project lookup yet
  // But don't show a separate loading state if the store is still loading
  const isLoadingProject = projectParam && !hasProcessedLookup && !isLoading

  const handleBackToGrid = () => {
    // Use Next.js router to properly update URL
    router.push('/')
  }

  // Only show project loading if we're not already showing store loading
  if (isLoadingProject) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <NavigationBar variant="back" />
          <SyncStatus />
          <div className="pt-6">
            <LoadingScreen message="Loading project..." />
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Show project view if a project is selected
  if (selectedProject || isNewProject) {
    const displayProject = selectedProject || (isNewProject && projectParam ? {
      id: projectParam,
      name: '',
      description: null,
      notes: null,
      status: 'active' as const,
      priority: 'normal' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order: 1,
      syncState: 'local' as const,
      remoteId: undefined,
      lastError: undefined
    } : null)

    if (!displayProject) {
      // Project not found - go back to grid
      handleBackToGrid()
      return null
    }

    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <NavigationBar variant="back" />
          <SyncStatus />
          <ProjectTodoView
            project={displayProject}
            onBack={handleBackToGrid}
            isNewProject={isNewProject}
          />
        </div>
      </AuthGuard>
    )
  }


  // Show project grid by default
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavigationBar variant="title" title="Done and Done" />
        <SyncStatus />
        <ProjectGrid />
      </div>
    </AuthGuard>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <NavigationBar variant="title" title="Done and Done" />
          <SyncStatus />
          <div className="pt-6">
            <LoadingScreen />
          </div>
        </div>
      </AuthGuard>
    }>
      <HomeContent />
    </Suspense>
  )
}
