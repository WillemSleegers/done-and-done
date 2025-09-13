'use client'

import { useRouter } from 'next/navigation'
import ProjectGrid from '@/components/project/ProjectGrid'
import SyncStatus from '@/components/system/SyncStatus'
import { ModeToggle } from '@/components/layout/ModeToggle'
import UserMenu from '@/components/navigation/UserMenu'
import AuthGuard from '@/components/auth/AuthGuard'
import { type Project } from '@/lib/services/syncService'

export default function Home() {
  const router = useRouter()

  const handleProjectSelect = (project: Project, isNewProject?: boolean) => {
    const url = isNewProject 
      ? `/projects/${project.id}?new=true`
      : `/projects/${project.id}`
    router.push(url)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <UserMenu />
          <ModeToggle />
        </div>
        <SyncStatus />
        <ProjectGrid onProjectSelect={handleProjectSelect} />
      </div>
    </AuthGuard>
  )
}
