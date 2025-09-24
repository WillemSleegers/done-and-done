"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useProjectStore } from "@/lib/store/projectStore"
import { createSlug } from "@/lib/utils"
import AuthGuard from "@/components/auth/AuthGuard"
import NavigationBar from "@/components/navigation/NavigationBar"
import SyncStatus from "@/components/system/SyncStatus"
import ProjectGrid from "@/components/project/ProjectGrid"
import ProjectTodoView from "@/components/project/ProjectTodoView"

export default function Home() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getProject, getProjectBySlug, projects, isLoading } = useProjectStore()

  const projectParam = searchParams.get('project')
  const isNewProject = searchParams.get('new') === 'true'

  // Use state to store the selected project and track if we've processed the lookup
  const [selectedProject, setSelectedProject] = useState(null)
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
      const found = getProjectBySlug(projectParam) || getProject(projectParam)
      setSelectedProject(found)
      setHasProcessedLookup(true)
    } else {
      setHasProcessedLookup(false)
    }
  }, [projectParam, projects, isLoading, getProjectBySlug, getProject])

  // Show loading if we haven't finished processing the project lookup yet
  const isLoadingProject = projectParam && !hasProcessedLookup

  const handleBackToGrid = () => {
    // Use Next.js router to properly update URL
    router.push('/')
  }

  // Show loading if we're waiting for project data
  if (isLoadingProject) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <NavigationBar variant="back" />
          <SyncStatus />
          <div className="flex items-center justify-center pt-20">
            <div className="text-muted-foreground">Loading project...</div>
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
