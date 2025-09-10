'use client'

import { useRouter } from 'next/navigation'
import ProjectGrid from '@/components/project/ProjectGrid'
import SyncStatus from '@/components/system/SyncStatus'
import { ModeToggle } from '@/components/ui/ModeToggle'
import UserMenu from '@/components/ui/UserMenu'
import AuthGuard from '@/components/auth/AuthGuard'
import { type Project } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  const handleProjectSelect = (project: Project) => {
    router.push(`/projects/${project.id}`)
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
