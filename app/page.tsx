"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"
import AuthGuard from "@/components/auth/AuthGuard"
import ProjectGrid from "@/components/project/ProjectGrid"
import ProjectTodoView from "@/components/project/ProjectTodoView"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getProject } = useProjectStore()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isNewProject, setIsNewProject] = useState(false)

  // Check URL for selected project
  useEffect(() => {
    const projectId = searchParams.get('project')
    const isNew = searchParams.get('new') === 'true'

    if (projectId) {
      if (isNew) {
        // Handle new project
        const newProject: Project = {
          id: projectId,
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
      } else {
        // Find existing project
        const project = getProject(projectId)
        if (project) {
          setSelectedProject(project)
          setIsNewProject(false)
        } else {
          // Project not found, go back to grid
          router.push('/')
        }
      }
    } else {
      setSelectedProject(null)
      setIsNewProject(false)
    }
  }, [searchParams, getProject, router])

  const handleSelectProject = (project: Project) => {
    router.push(`/?project=${project.id}`)
  }

  const handleCreateNewProject = () => {
    const newProjectId = crypto.randomUUID()
    router.push(`/?project=${newProjectId}&new=true`)
  }

  const handleBackToGrid = () => {
    router.push('/')
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
