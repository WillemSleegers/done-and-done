"use client"

import { useState } from "react"
import type { Project } from "@/lib/services/syncService"
import AuthGuard from "@/components/auth/AuthGuard"
import ProjectGrid from "@/components/project/ProjectGrid"
import ProjectTodoView from "@/components/project/ProjectTodoView"

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isNewProject, setIsNewProject] = useState(false)

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project)
    setIsNewProject(false)
  }

  const handleCreateNewProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
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
  }

  const handleBackToGrid = () => {
    setSelectedProject(null)
    setIsNewProject(false)
  }

  // Show project view if a project is selected
  if (selectedProject) {
    return (
      <AuthGuard>
        <ProjectTodoView
          project={selectedProject}
          onBack={handleBackToGrid}
          isNewProject={isNewProject}
        />
      </AuthGuard>
    )
  }

  // Show project grid by default
  return (
    <AuthGuard>
      <ProjectGrid
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateNewProject}
      />
    </AuthGuard>
  )
}
