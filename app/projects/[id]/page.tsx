'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useProjectStore } from '@/lib/store/projectStore'
import ProjectTodoView from '@/components/project/ProjectTodoView'
import SyncStatus from '@/components/system/SyncStatus'
import NavigationBar from '@/components/navigation/NavigationBar'
import AuthGuard from '@/components/auth/AuthGuard'

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { projects } = useProjectStore()
  
  const projectId = params.id as string
  const project = projects.find(p => p.id === projectId)
  const isNewProject = searchParams.get('new') === 'true'

  const handleBack = () => {
    router.push('/')
  }

  // If project not found and it's not a new project, redirect back to home
  useEffect(() => {
    if (!project && !isNewProject && projects.length > 0) {
      router.push('/')
    }
  }, [project, isNewProject, projects.length, router])

  // For new projects, create a temporary project object
  const displayProject = project || (isNewProject ? {
    id: projectId,
    name: '',
    description: null,
    notes: null,
    status: 'active' as const,
    priority: 'normal' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    syncState: 'local' as const,
    remoteId: undefined,
    lastError: undefined
  } : null)

  // Don't render anything if no project and not new
  if (!displayProject) {
    return null
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavigationBar variant="back" />
        <SyncStatus />
        <ProjectTodoView
          project={displayProject}
          onBack={handleBack}
          isNewProject={isNewProject}
        />
      </div>
    </AuthGuard>
  )
}