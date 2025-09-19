'use client'

import { useProjectStore } from '@/lib/store/projectStore'
import ProjectTile from '@/components/project/ProjectTile'
import SyncStatus from '@/components/system/SyncStatus'
import NavigationBar from '@/components/navigation/NavigationBar'
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
  const { projects, todoCounts } = useProjectStore()

  const inactiveProjects = projects.filter((p) => p.status === "inactive")
  const sortedInactiveProjects = [...inactiveProjects].sort((a, b) => {
    const priorityOrderA = getPriorityOrder(a.priority)
    const priorityOrderB = getPriorityOrder(b.priority)
    if (priorityOrderA !== priorityOrderB) {
      return priorityOrderA - priorityOrderB
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavigationBar variant="back" />
        <SyncStatus />

        <div className="p-6">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8">
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