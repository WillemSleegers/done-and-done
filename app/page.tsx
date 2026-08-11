"use client"

import { useEffect,useLayoutEffect,useRef,useState } from "react"

import AuthGuard from "@/components/auth/AuthGuard"
import NavigationBar from "@/components/navigation/NavigationBar"
import ProjectGrid from "@/components/project/ProjectGrid"
import ProjectTodoView from "@/components/project/ProjectTodoView"
import type { Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"

// Restoring scroll before paint avoids a visible jump; falls back on the server
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const { projects, addProject } = useProjectStore()
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null
  const gridScrollRef = useRef(0)

  // iOS PWAs restore the previous session's URL and history, so start from a
  // clean grid entry instead of a stale ?project= that never got rendered
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }
    window.history.replaceState({ projectId: null }, "", "/")
  }, [])

  // The grid unmounts while a project is open, so the browser cannot keep its
  // scroll offset for us
  useIsomorphicLayoutEffect(() => {
    window.scrollTo(0, selectedProjectId ? 0 : gridScrollRef.current)
  }, [selectedProjectId])

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

  const rememberGridScroll = () => {
    gridScrollRef.current = window.scrollY
  }

  const handleSelectProject = (project: Project) => {
    rememberGridScroll()
    setSelectedProjectId(project.id)
    // Update URL for bookmarking without triggering navigation
    window.history.pushState({ projectId: project.id }, "", `/?project=${project.id}`)
  }

  const handleCreateNewProject = async () => {
    rememberGridScroll()
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
