'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useProjectStore } from '@/lib/store/projectStore'
import ProjectTodoView from '@/components/project/ProjectTodoView'
import SyncStatus from '@/components/system/SyncStatus'
import { ModeToggle } from '@/components/layout/ModeToggle'
import UserMenu from '@/components/navigation/UserMenu'
import AuthGuard from '@/components/auth/AuthGuard'

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { projects, isLoading } = useProjectStore()
  
  const projectId = params.id as string
  const project = projects.find(p => p.id === projectId)
  const isNewProject = searchParams.get('new') === 'true'

  const handleBack = () => {
    router.push('/')
  }

  // Only show loading if we're in initial load state AND have no projects data at all
  const shouldShowLoading = isLoading && projects.length === 0
  
  // If we have projects loaded but this specific project doesn't exist, redirect
  useEffect(() => {
    if (!isLoading && projects.length > 0 && !project) {
      router.push('/')
    }
  }, [isLoading, projects.length, project, router])

  // Show loading only if we truly don't have any data yet
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    )
  }

  // If project not found (and we have data), don't render anything (redirect is happening)
  if (!project && projects.length > 0) {
    return null
  }

  // If we don't have the project yet but we're still loading, show loading
  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <UserMenu />
          <ModeToggle />
        </div>
        <SyncStatus />
        <ProjectTodoView 
          project={project}
          onBack={handleBack}
          isNewProject={isNewProject}
        />
      </div>
    </AuthGuard>
  )
}