"use client"

import { useEffect,useState } from "react"

import AuthGuard from "@/components/auth/AuthGuard"
import NavigationBar from "@/components/navigation/NavigationBar"
import ProjectGrid from "@/components/project/ProjectGrid"
import ProjectTodoView from "@/components/project/ProjectTodoView"
import type { Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const { projects, addProject } = useProjectStore()
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null

  // iOS PWAs restore the previous session's URL and history, so start from a
  // clean grid entry instead of a stale ?project= that never got rendered
  useEffect(() => {
    window.history.replaceState({ projectId: null }, "", "/")
  }, [])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const projectId =
        (event.state as { projectId?: string | null } | null)?.projectId ?? null

      if (projectId && projects.some((p) => p.id === projectId)) {
        setSelectedProjectId(projectId)
      } else {
        setSelectedProjectId(null)
        if (window.location.search) {
          window.history.replaceState({ projectId: null }, "", "/")
        }
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [projects])

  const handleSelectProject = (project: Project) => {
    setSelectedProjectId(project.id)
    // Update URL for bookmarking without triggering navigation
    window.history.pushState({ projectId: project.id }, "", `/?project=${project.id}`)
  }

  const handleCreateNewProject = async () => {
    const newProject = await addProject({
      id: crypto.randomUUID(),
      name: "Untitled Project",
      notes: null,
      category: null,
      status: "active",
      priority: "normal",
      order: 0,
    })
    setSelectedProjectId(newProject.id)
    // Update URL for bookmarking without triggering navigation
    window.history.pushState({ projectId: newProject.id }, "", `/?project=${newProject.id}`)
  }

  const handleBackToGrid = () => {
    window.history.back()
  }

  if (selectedProject) {
    return (
      <AuthGuard>
        <NavigationBar variant="back" onBack={handleBackToGrid} />
        <main className="flex-1">
          <ProjectTodoView key={selectedProject.id} project={selectedProject} onBack={handleBackToGrid} />
        </main>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <NavigationBar variant="title" />
      <main className="flex-1">
        <ProjectGrid
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateNewProject}
        />
      </main>
    </AuthGuard>
  )
}
