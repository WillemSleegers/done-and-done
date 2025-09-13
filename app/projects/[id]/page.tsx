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