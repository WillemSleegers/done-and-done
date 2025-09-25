"use client"

import { useState } from "react"
import type { Project } from "@/lib/services/syncService"
import AuthGuard from "@/components/auth/AuthGuard"
import NavigationBar from "@/components/navigation/NavigationBar"
import SyncStatus from "@/components/system/SyncStatus"
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
        <div className="min-h-screen bg-background">
          <NavigationBar variant="back" onBack={handleBackToGrid} />
          <SyncStatus />
          <ProjectTodoView
            project={selectedProject}
            onBack={handleBackToGrid}
            isNewProject={isNewProject}
          />
        </div>
      </AuthGuard>
    )
  }

  // Show project grid by default
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavigationBar variant="title" title="Done and Done" />
        <SyncStatus />
        <ProjectGrid
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateNewProject}
        />
      </div>
    </AuthGuard>
  )
}
