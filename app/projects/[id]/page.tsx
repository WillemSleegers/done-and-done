'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useProjectStore } from '@/lib/store/projectStore'
import ProjectTodoView from '@/components/project/ProjectTodoView'
import SyncStatus from '@/components/system/SyncStatus'
import NavigationBar from '@/components/navigation/NavigationBar'
import AuthGuard from '@/components/auth/AuthGuard'

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { isLoading, getProject } = useProjectStore()

  const projectId = params.id as string
  const project = getProject(projectId)
  const isNewProject = searchParams.get('new') === 'true'

  const handleBack = () => {
    router.push('/')
  }

  // Project lookup is working correctly - if not found, show error message

  const displayProject = project || (isNewProject ? {
    id: projectId,
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

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <NavigationBar variant="back" />
          <SyncStatus />
          <div className="flex items-center justify-center pt-20">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!displayProject) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <NavigationBar variant="back" />
          <SyncStatus />
          <div className="flex flex-col items-center justify-center pt-20 gap-4">
            <div className="text-foreground text-lg">Project not found</div>
            <div className="text-muted-foreground text-sm">This project may have been deleted or moved.</div>
            <button
              onClick={() => router.push('/')}
              className="text-primary hover:underline"
            >
              Go back to projects
            </button>
          </div>
        </div>
      </AuthGuard>
    )
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