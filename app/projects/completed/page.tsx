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

export default function CompletedProjectsPage() {
  const { projects, todoCounts } = useProjectStore()
  
  // Filter and sort completed projects
  const completedProjects = projects.filter((p) => p.status === "complete")
  const sortedCompletedProjects = [...completedProjects].sort((a, b) => {
    // First sort by priority
    const priorityOrderA = getPriorityOrder(a.priority)
    const priorityOrderB = getPriorityOrder(b.priority)
    if (priorityOrderA !== priorityOrderB) {
      return priorityOrderA - priorityOrderB
    }

    // Then by created date (newest first)
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
              Completed Projects
            </h1>
            <p className="text-center text-muted-foreground mt-2">
              {sortedCompletedProjects.length} completed project{sortedCompletedProjects.length === 1 ? '' : 's'}
            </p>
          </div>

          {/* Projects Grid */}
          <div className="flex flex-wrap gap-4 max-w-4xl mx-auto">
            {sortedCompletedProjects.map((project) => {
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

          {sortedCompletedProjects.length === 0 && (
            <div className="text-center text-muted-foreground mt-8">
              <p>No completed projects yet.</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}