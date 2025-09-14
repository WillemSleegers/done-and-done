"use client"

import { type Project } from "@/lib/services/syncService"
import { Plus, FolderOpen, Loader2, Archive, CheckCircle } from "lucide-react"
import { useProjectStore } from "@/lib/store/projectStore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import ProjectTile from "./ProjectTile"


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

const sortProjectsByPriority = (projects: Project[]) => {
  return [...projects].sort((a, b) => {
    // First sort by priority
    const priorityOrderA = getPriorityOrder(a.priority)
    const priorityOrderB = getPriorityOrder(b.priority)
    if (priorityOrderA !== priorityOrderB) {
      return priorityOrderA - priorityOrderB
    }

    // Then by created date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export default function ProjectGrid() {
  const { projects, todoCounts, isLoading } = useProjectStore()
  const router = useRouter()

  // Separate projects by status
  const activeProjects = projects.filter((p) => p.status === "active")
  const inactiveProjects = projects.filter((p) => p.status === "inactive")
  const completedProjects = projects.filter((p) => p.status === "complete")

  // Sort active and inactive projects by priority, then date
  const sortedActiveProjects = sortProjectsByPriority(activeProjects)
  const sortedInactiveProjects = sortProjectsByPriority(inactiveProjects)

  // Sort completed projects by completion date (newest first)
  const sortedCompletedProjects = [...completedProjects].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleCreateProject = () => {
    const projectId = crypto.randomUUID()
    router.push(`/projects/${projectId}?new=true`)
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
        Done and Done
      </h1>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      ) : (
        <>
          {/* Active Projects Section */}
          <div className="flex flex-wrap gap-4 max-w-4xl mx-auto">
            {/* Project Tiles */}
            {sortedActiveProjects.map((project) => {
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

            {/* Add New Project Tile */}
            <Button
              variant="ghost"
              onClick={handleCreateProject}
              className="flex-1 min-w-56 h-24 p-4 border-2 border-border border-dashed rounded-md hover:bg-accent/20 transition-all duration-200 transform hover:scale-105 group"
            >
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-foreground">
                <Plus size={24} className="mb-2" />
                <span className="text-sm font-medium">New Project</span>
              </div>
            </Button>

            {/* Inactive Projects Summary Tile */}
            {sortedInactiveProjects.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => router.push("/projects/inactive")}
                className="flex-1 min-w-56 h-24 p-4 border rounded-md hover:bg-accent/20 transition-all duration-200 transform hover:scale-105 group"
              >
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-foreground">
                  <Archive size={24} className="mb-2" />
                  <span className="text-sm font-medium">
                    {sortedInactiveProjects.length} Inactive Project
                    {sortedInactiveProjects.length === 1 ? "" : "s"}
                  </span>
                </div>
              </Button>
            )}

            {/* Completed Projects Summary Tile */}
            {sortedCompletedProjects.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => router.push("/projects/completed")}
                className="flex-1 min-w-56 h-24 p-4 border rounded-md hover:bg-accent/20 transition-all duration-200 transform hover:scale-105 group"
              >
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-foreground">
                  <CheckCircle size={24} className="mb-2" />
                  <span className="text-sm font-medium">
                    {sortedCompletedProjects.length} Completed Project
                    {sortedCompletedProjects.length === 1 ? "" : "s"}
                  </span>
                </div>
              </Button>
            )}
          </div>

          {projects.length === 0 && (
            <div className="text-center text-muted-foreground mt-8">
              <FolderOpen size={48} className="mx-auto mb-4 text-muted" />
              <p>No projects yet. Create your first project to get started!</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
