"use client"

import { type Project } from "@/lib/services/syncService"
import { Plus, FolderOpen, Loader2 } from "lucide-react"
import { useProjectStore } from "@/lib/store/projectStore"
import { Button } from "@/components/ui/button"
import ProjectTile from "./ProjectTile"

interface ProjectGridProps {
  onProjectSelect: (project: Project, isNewProject?: boolean) => void
}

const getStatusOrder = (status: string): number => {
  switch (status) {
    case "active":
      return 1
    case "inactive":
      return 2
    case "complete":
      return 3
    default:
      return 1
  }
}

export default function ProjectGrid({ onProjectSelect }: ProjectGridProps) {
  const { projects, todoCounts, isLoading, addProject } = useProjectStore()

  // Separate active/inactive projects from completed ones
  const activeProjects = projects.filter(p => p.status !== 'complete')
  const completedProjects = projects.filter(p => p.status === 'complete')
  
  // Sort active projects: active first, then inactive
  const sortedActiveProjects = [...activeProjects].sort((a, b) => {
    const statusOrderA = getStatusOrder(a.status)
    const statusOrderB = getStatusOrder(b.status)
    if (statusOrderA !== statusOrderB) {
      return statusOrderA - statusOrderB
    }
    // If same status, sort by created date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  
  // Sort completed projects by completion date (newest first)
  const sortedCompletedProjects = [...completedProjects].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleCreateProject = async () => {
    const project = await addProject({
      name: "Untitled Project",
      description: null,
      status: "active",
      priority: "normal",
    })
    onProjectSelect(project, true) // Immediately navigate to the new project
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
          <div className="flex flex-wrap gap-4 justify-start max-w-4xl mx-auto">
            {/* Project Tiles */}
            {sortedActiveProjects.map((project) => {
              const counts = todoCounts[project.id] || { total: 0, completed: 0 }
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
              className="w-48 h-24 p-4 border-2 border-dashed border-border rounded-md hover:border-primary hover:bg-muted transition-all duration-200 group"
            >
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-primary">
                <Plus size={24} className="mb-2" />
                <span className="text-sm font-medium">New Project</span>
              </div>
            </Button>
          </div>

          {/* Completed Projects Section */}
          {sortedCompletedProjects.length > 0 && (
            <div className="mt-12 max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold text-muted-foreground mb-6 text-center">
                Completed Projects
              </h2>
              <div className="flex flex-wrap gap-4 justify-start">
                {sortedCompletedProjects.map((project) => {
                  const counts = todoCounts[project.id] || { total: 0, completed: 0 }
                  return (
                    <ProjectTile
                      key={project.id}
                      project={project}
                      todoCounts={counts}
                    />
                  )
                })}
              </div>
            </div>
          )}

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
