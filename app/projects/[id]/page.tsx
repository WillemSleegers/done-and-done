'use client'

import { useRouter, useParams } from 'next/navigation'
import { useData } from '@/lib/DataProvider'
import ProjectTodoView from '@/components/project/ProjectTodoView'
import SyncStatus from '@/components/system/SyncStatus'
import { ModeToggle } from '@/components/ui/ModeToggle'
import UserMenu from '@/components/ui/UserMenu'
import AuthGuard from '@/components/auth/AuthGuard'
import { useEffect } from 'react'

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const { projects, isLoading } = useData()
  
  const projectId = params.id as string
  const project = projects.find(p => p.id === projectId)

  const handleBack = () => {
    router.push('/')
  }

  // If data is loaded but project not found, redirect to home
  useEffect(() => {
    if (!isLoading && !project) {
      router.push('/')
    }
  }, [isLoading, project, router])

  // Show loading state only while initial data is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    )
  }

  // If project not found after loading, don't render anything (redirect is happening)
  if (!project) {
    return null
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
        />
      </div>
    </AuthGuard>
  )
}