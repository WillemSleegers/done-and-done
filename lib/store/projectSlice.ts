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

    syncService.syncProject(newProject, (updatedProject) => {
      set((state) => applyProjectUpdate(state, updatedProject))
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
      syncService.updateProject(project, updates, (syncedProject) => {
        set((state) => applyProjectUpdate(state, syncedProject))
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
      set((state) => ({
        projects: [...state.projects, project],
        todos: { ...state.todos, [projectId]: todos[projectId] || [] },
      }))
      throw error
    }
  },

  retryFailedProject: async (projectId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project || project.syncState !== "failed") return

    syncService.syncProject(project, (updatedProject) => {
      set((state) => applyProjectUpdate(state, updatedProject))
    })
  },

  reorderProjects: async (newOrder) => {
    // Update order values based on new position
    const reorderedProjects = newOrder.map((project, index) => ({
      ...project,
      order: index + 1,
    }))

    // Update local state immediately for optimistic UI
    set(() => ({
      projects: reorderedProjects,
    }))

    // Sync to server
    try {
      await syncService.updateProjectsOrder(reorderedProjects)
    } catch (error) {
      logger.error("Failed to sync project order:", error)
      // Could add retry logic here if needed
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
