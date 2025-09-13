'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useProjectStore } from '@/lib/store/projectStore'
import { Button } from '@/components/ui/button'
import ProjectTile from '@/components/project/ProjectTile'
import SyncStatus from '@/components/system/SyncStatus'
import { ModeToggle } from '@/components/layout/ModeToggle'
import UserMenu from '@/components/navigation/UserMenu'
import AuthGuard from '@/components/auth/AuthGuard'

const getPriorityOrder = (priority: string): number => {
  switch (priority) {
    case "high":
      return 1
    case "normal":
      return 2
    case "low":
      return 3
    default:
      return 2
  }
}

export default function InactiveProjectsPage() {
  const router = useRouter()
  const { projects, todoCounts } = useProjectStore()
  
  // Filter and sort inactive projects
  const inactiveProjects = projects.filter((p) => p.status === "inactive")
  const sortedInactiveProjects = [...inactiveProjects].sort((a, b) => {
    // First sort by priority
    const priorityOrderA = getPriorityOrder(a.priority)
    const priorityOrderB = getPriorityOrder(b.priority)
    if (priorityOrderA !== priorityOrderB) {
      return priorityOrderA - priorityOrderB
    }

    // Then by created date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

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
        
        <div className="p-6">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 p-2 h-auto"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Projects
            </Button>
            
            <h1 className="text-3xl font-bold text-center text-foreground">
              Inactive Projects
            </h1>
            <p className="text-center text-muted-foreground mt-2">
              {sortedInactiveProjects.length} inactive project{sortedInactiveProjects.length === 1 ? '' : 's'}
            </p>
          </div>

          {/* Projects Grid */}
          <div className="flex flex-wrap gap-4 max-w-4xl mx-auto">
            {sortedInactiveProjects.map((project) => {
              const counts = todoCounts[project.id] || {
                total: 0,
                completed: 0,
              }
              return (
                <ProjectTile
                  key={project.id}
                  project={project}
                  todoCounts={counts}
                />
              )
            })}
          </div>

          {sortedInactiveProjects.length === 0 && (
            <div className="text-center text-muted-foreground mt-8">
              <p>No inactive projects yet.</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}