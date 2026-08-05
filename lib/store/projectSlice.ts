import { type StateCreator } from "zustand"

import { logger } from "@/lib/logger"
import { type Project, syncService } from "@/lib/services/syncService"
import { syncActivityTracker } from "@/lib/syncActivityTracker"

import { applyProjectUpdate, generateId, updateTodoCounts } from "./helpers"
import { type ProjectActions, type ProjectStore } from "./types"

type ProjectSliceActions = Pick<
  ProjectActions,
  | "addProject"
  | "updateProject"
  | "deleteProject"
  | "retryFailedProject"
  | "reorderProjects"
  | "getProjectsSortedByOrder"
  | "getProject"
>

export const createProjectSlice: StateCreator<ProjectStore, [], [], ProjectSliceActions> = (
  set,
  get
) => ({
  addProject: async (projectData) => {
    const { projects } = get()
    const maxOrder = projects.length > 0 ? Math.max(...projects.map((p) => p.order)) : 0

    const newProject: Project = {
      ...projectData,
      id: projectData.id || generateId(),
      created_at: new Date().toISOString(),
      order: maxOrder + 1,
      syncState: "local",
    }

    set((state) => ({
      projects: [...state.projects, newProject],
      todos: { ...state.todos, [newProject.id]: [] },
    }))

    // Track activity
    syncActivityTracker.addActivity({
      id: newProject.id,
      name: newProject.name,
      type: "project",
      action: "added",
    })

    syncService.syncProject(newProject, (patch) => {
      set((state) => applyProjectUpdate(state, patch))

      if (patch.syncState === "synced") {
        const current = get().projects.find((p) => p.id === newProject.id)
        if (current) {
          const drift: Partial<
            Pick<Project, "name" | "notes" | "status" | "priority" | "category" | "order">
          > = {}
          if (current.name !== newProject.name) drift.name = current.name
          if (current.notes !== newProject.notes) drift.notes = current.notes
          if (current.status !== newProject.status) drift.status = current.status
          if (current.priority !== newProject.priority) drift.priority = current.priority
          if (current.category !== newProject.category) drift.category = current.category
          if (current.order !== newProject.order) drift.order = current.order

          if (Object.keys(drift).length > 0) {
            syncService.updateProject(current, drift, (p) =>
              set((state) => applyProjectUpdate(state, p))
            )
          }
        }
      }
    })

    return newProject
  },

  updateProject: async (projectId, updates) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return

    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),
    }))

    if (project.remoteId) {
      syncService.updateProject(project, updates, (patch) => {
        set((state) => applyProjectUpdate(state, patch))
      })
    }
  },

  deleteProject: async (projectId) => {
    const { projects, todos } = get()
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    set((state) => {
      const newTodos = { ...state.todos }
      delete newTodos[projectId]
      const todoCounts = updateTodoCounts(newTodos)

      return {
        projects: state.projects.filter((p) => p.id !== projectId),
        todos: newTodos,
        todoCounts,
      }
    })

    // Track activity
    syncActivityTracker.addActivity({
      id: project.id,
      name: project.name,
      type: "project",
      action: "deleted",
    })

    try {
      await syncService.deleteProject(project)
    } catch (error) {
      const lastError = error instanceof Error ? error.message : "Delete failed"
      set((state) => ({
        projects: [
          ...state.projects,
          { ...project, syncState: "failed" as const, lastError, pendingOperation: "delete" as const },
        ],
        todos: { ...state.todos, [projectId]: todos[projectId] || [] },
      }))
      throw error
    }
  },

  retryFailedProject: async (projectId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project || project.syncState !== "failed") return

    if (project.pendingOperation === "delete") {
      await get().deleteProject(projectId)
      return
    }

    if (project.remoteId) {
      syncService.updateProject(
        project,
        {
          name: project.name,
          notes: project.notes,
          status: project.status,
          priority: project.priority,
          category: project.category,
          order: project.order,
        },
        (patch) => {
          set((state) => applyProjectUpdate(state, patch))
        }
      )
    } else {
      syncService.syncProject(project, (patch) => {
        set((state) => applyProjectUpdate(state, patch))
      })
    }
  },

  reorderProjects: async (newOrder) => {
    const previousProjects = get().projects

    // Update order values based on new position
    const reorderedProjects = newOrder.map((project, index) => ({
      ...project,
      order: index + 1,
    }))

    // Update local state immediately for optimistic UI
    set(() => ({
      projects: reorderedProjects,
    }))

    // Only push the items whose order actually changed
    const changedProjects = reorderedProjects.filter((project) => {
      const previous = previousProjects.find((p) => p.id === project.id)
      return previous && previous.order !== project.order
    })

    if (changedProjects.length === 0) return

    // Sync to server
    try {
      await syncService.updateProjectsOrder(changedProjects)
    } catch (error) {
      logger.error("Failed to sync project order:", error)
      set((state) => ({
        projects: state.projects.map((p) =>
          p.remoteId && changedProjects.some((cp) => cp.id === p.id)
            ? { ...p, syncState: "failed" as const, lastError: "Failed to save order" }
            : p
        ),
      }))
    }
  },

  getProjectsSortedByOrder: () => {
    const projects = get().projects
    // Sort by order field for consistent display
    return [...projects].sort((a, b) => a.order - b.order)
  },

  getProject: (projectId) => {
    return get().projects.find((p) => p.id === projectId)
  },
})
