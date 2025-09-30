"use client"

import { useState } from "react"
import type { Project } from "@/lib/services/syncService"
import AuthGuard from "@/components/auth/AuthGuard"
import NavigationBar from "@/components/navigation/NavigationBar"
import ProjectGrid from "@/components/project/ProjectGrid"
import ProjectTodoView from "@/components/project/ProjectTodoView"

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isNewProject, setIsNewProject] = useState(false)

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project)
    setIsNewProject(false)
    // Update URL for bookmarking without triggering navigation
    window.history.pushState({}, '', `/?project=${project.id}`)
  }

  const handleCreateNewProject = () => {
    const newProjectId = crypto.randomUUID()
    const newProject: Project = {
      id: newProjectId,
      name: '',
      notes: null,
      status: 'active',
      priority: 'normal',
      created_at: new Date().toISOString(),
      order: 1,
      syncState: 'local',
      remoteId: undefined,
      lastError: undefined
    }
    setSelectedProject(newProject)
    setIsNewProject(true)
    // Update URL for bookmarking without triggering navigation
    window.history.pushState({}, '', `/?project=${newProjectId}&new=true`)
  }

  const handleBackToGrid = () => {
    setSelectedProject(null)
    setIsNewProject(false)
    // Update URL for bookmarking without triggering navigation
    window.history.pushState({}, '', '/')
  }

  if (selectedProject) {
    return (
      <AuthGuard>
        <NavigationBar variant="back" onBack={handleBackToGrid} />
        <main className="flex-1">
          <ProjectTodoView
            project={selectedProject}
            onBack={handleBackToGrid}
            isNewProject={isNewProject}
          />
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
