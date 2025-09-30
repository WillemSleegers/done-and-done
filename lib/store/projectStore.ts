import { create } from "zustand"
import { syncService, type Project, type Todo } from "@/lib/services/syncService"
import { syncActivityTracker } from "@/lib/syncActivityTracker"
import { logger } from "@/lib/logger"

interface ProjectState {
  projects: Project[]
  todos: Record<string, Todo[]>
  todoCounts: Record<string, { total: number; completed: number }>
  isLoading: boolean
}

interface ProjectActions {
  fetchInitialData: () => Promise<void>
  refreshData: () => Promise<void>

  addProject: (
    data: Omit<Project, "created_at" | "syncState" | "remoteId"> & { id?: string }
  ) => Promise<Project>
  updateProject: (
    projectId: string,
    updates: Partial<Pick<Project, "name" | "notes" | "status" | "priority">>
  ) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  retryFailedProject: (projectId: string) => Promise<void>

  addTodo: (projectId: string, text: string) => Promise<Todo>
  updateTodo: (
    todoId: string,
    updates: Partial<Pick<Todo, "text" | "completed" | "completed_at" | "due_date">>
  ) => Promise<void>
  deleteTodo: (todoId: string, projectId: string) => Promise<void>
  retryFailedTodo: (todoId: string, projectId: string) => Promise<void>
  reorderTodos: (projectId: string, newOrder: Todo[]) => Promise<void>
  reorderProjects: (newOrder: Project[]) => Promise<void>

  getProjectTodos: (projectId: string) => Todo[]
  getProjectsSortedByOrder: () => Project[]
  getProject: (projectId: string) => Project | undefined
}

type ProjectStore = ProjectState & ProjectActions

const generateId = () => crypto.randomUUID()

const updateTodoCounts = (todos: Record<string, Todo[]>) => {
  const counts: Record<string, { total: number; completed: number }> = {}
  Object.entries(todos).forEach(([projectId, projectTodos]) => {
    const total = projectTodos.length
    const completed = projectTodos.filter((todo) => todo.completed).length
    counts[projectId] = { total, completed }
  })
  return counts
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  todos: {},
  todoCounts: {},
  isLoading: true,

  fetchInitialData: async () => {
    const currentState = get()
    if (currentState.projects.length === 0) {
      set({ isLoading: true })
    }
    try {
      logger.info("Fetching initial data via sync service")
      const { projects, todos } = await syncService.fetchInitialData(
        currentState.projects,
        currentState.todos
      )

      // Preserve any local/syncing items that haven't been saved to the server yet
      const localProjects = currentState.projects.filter(
        (p) => p.syncState === "local" || p.syncState === "syncing" || p.syncState === "failed"
      )
      const mergedProjects = [
        ...projects,
        ...localProjects.filter((lp) => !projects.some((p) => p.id === lp.id)),
      ]

      const mergedTodos = { ...todos }
      Object.entries(currentState.todos).forEach(([projectId, projectTodos]) => {
        const localTodos = projectTodos.filter(
          (t) => t.syncState === "local" || t.syncState === "syncing" || t.syncState === "failed"
        )
        if (localTodos.length > 0) {
          const existingTodos = mergedTodos[projectId] || []
          mergedTodos[projectId] = [
            ...existingTodos,
            ...localTodos.filter((lt) => !existingTodos.some((t) => t.id === lt.id)),
          ]
        }
      })

      const todoCounts = updateTodoCounts(mergedTodos)
      logger.info("Initial data loaded successfully")
      set({ projects: mergedProjects, todos: mergedTodos, todoCounts, isLoading: false })
    } catch (error) {
      logger.error("Failed to fetch initial data:", error)
      set({ isLoading: false })
    }
  },

  refreshData: async () => {
    await get().fetchInitialData()
  },

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
      set((state) => ({
        projects: state.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
      }))
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
        set((state) => ({
          projects: state.projects.map((p) => (p.id === syncedProject.id ? syncedProject : p)),
        }))
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
      set((state) => ({
        projects: state.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
      }))
    })
  },

  addTodo: async (projectId, text) => {
    const { todos } = get()
    const existingTodos = todos[projectId] || []
    const maxOrder = existingTodos.length > 0 ? Math.max(...existingTodos.map((t) => t.order)) : 0

    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      project_id: projectId,
      created_at: new Date().toISOString(),
      due_date: null,
      order: maxOrder + 1,
      syncState: "local",
    }

    set((state) => {
      const newTodos = {
        ...state.todos,
        [projectId]: [newTodo, ...(state.todos[projectId] || [])],
      }
      const todoCounts = updateTodoCounts(newTodos)
      return { todos: newTodos, todoCounts }
    })

    const project = get().projects.find((p) => p.id === projectId)

    // Track activity
    syncActivityTracker.addActivity({
      id: newTodo.id,
      name: text,
      type: "todo",
      action: "added",
      projectName: project?.name,
    })
    syncService.syncTodo(newTodo, project?.remoteId, (updatedTodo) => {
      set((state) => {
        const newTodos = {
          ...state.todos,
          [projectId]:
            state.todos[projectId]?.map((t) => (t.id === updatedTodo.id ? updatedTodo : t)) || [],
        }
        // Only update counts for the affected project
        const projectTodos = newTodos[projectId] || []
        const total = projectTodos.length
        const completed = projectTodos.filter((todo) => todo.completed).length
        const newTodoCounts = {
          ...state.todoCounts,
          [projectId]: { total, completed },
        }
        return { todos: newTodos, todoCounts: newTodoCounts }
      })
    })

    return newTodo
  },

  updateTodo: async (todoId, updates) => {
    const { todos } = get()
    const projectId = Object.keys(todos).find((pid) => todos[pid]?.some((t) => t.id === todoId))
    if (!projectId) return

    const todo = todos[projectId]?.find((t) => t.id === todoId)
    if (!todo) return

    set((state) => {
      const newTodos = {
        ...state.todos,
        [projectId]:
          state.todos[projectId]?.map((t) => (t.id === todoId ? { ...t, ...updates } : t)) || [],
      }
      const todoCounts = updateTodoCounts(newTodos)
      return { todos: newTodos, todoCounts }
    })

    // Track activity for completion changes
    const project = get().projects.find((p) => p.id === projectId)
    if ("completed" in updates && updates.completed !== todo.completed) {
      syncActivityTracker.addActivity({
        id: todo.id,
        name: todo.text,
        type: "todo",
        action: updates.completed ? "completed" : "uncompleted",
        projectName: project?.name,
      })
    } else if ("text" in updates && updates.text !== todo.text) {
      syncActivityTracker.addActivity({
        id: todo.id,
        name: updates.text || todo.text,
        type: "todo",
        action: "updated",
        projectName: project?.name,
      })
    }

    if (todo.remoteId) {
      syncService.updateTodo({ ...todo, ...updates }, updates, (updatedTodo) => {
        set((state) => {
          const newTodos = {
            ...state.todos,
            [projectId]:
              state.todos[projectId]?.map((t) => (t.id === updatedTodo.id ? updatedTodo : t)) || [],
          }
          // Only update counts for the affected project
          const projectTodos = newTodos[projectId] || []
          const total = projectTodos.length
          const completed = projectTodos.filter((todo) => todo.completed).length
          const newTodoCounts = {
            ...state.todoCounts,
            [projectId]: { total, completed },
          }
          return { todos: newTodos, todoCounts: newTodoCounts }
        })
      })
    }
  },

  deleteTodo: async (todoId, projectId) => {
    const todo = get().todos[projectId]?.find((t) => t.id === todoId)
    if (!todo) return

    set((state) => {
      const newTodos = {
        ...state.todos,
        [projectId]: state.todos[projectId]?.filter((t) => t.id !== todoId) || [],
      }
      const todoCounts = updateTodoCounts(newTodos)
      return { todos: newTodos, todoCounts }
    })

    // Track activity
    const project = get().projects.find((p) => p.id === projectId)
    syncActivityTracker.addActivity({
      id: todo.id,
      name: todo.text,
      type: "todo",
      action: "deleted",
      projectName: project?.name,
    })

    try {
      await syncService.deleteTodo(todo)
    } catch (error) {
      set((state) => {
        const newTodos = {
          ...state.todos,
          [projectId]: [...(state.todos[projectId] || []), todo].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
        }
        const todoCounts = updateTodoCounts(newTodos)
        return { todos: newTodos, todoCounts }
      })
      throw error
    }
  },

  retryFailedTodo: async (todoId, projectId) => {
    const { todos, projects } = get()
    const todo = todos[projectId]?.find((t) => t.id === todoId)
    if (!todo || todo.syncState !== "failed") return

    const project = projects.find((p) => p.id === projectId)

    if (todo.remoteId) {
      syncService.updateTodo(
        todo,
        { text: todo.text, completed: todo.completed },
        (updatedTodo) => {
          set((state) => {
            const newTodos = {
              ...state.todos,
              [projectId]:
                state.todos[projectId]?.map((t) => (t.id === updatedTodo.id ? updatedTodo : t)) ||
                [],
            }
            return { todos: newTodos }
          })
        }
      )
    } else {
      syncService.syncTodo(todo, project?.remoteId, (updatedTodo) => {
        set((state) => {
          const newTodos = {
            ...state.todos,
            [projectId]:
              state.todos[projectId]?.map((t) => (t.id === updatedTodo.id ? updatedTodo : t)) || [],
          }
          const todoCounts = updateTodoCounts(newTodos)
          return { todos: newTodos, todoCounts }
        })
      })
    }
  },

  reorderTodos: async (projectId, newOrder) => {
    // Update local state immediately for optimistic UI
    set((state) => ({
      todos: {
        ...state.todos,
        [projectId]: newOrder,
      },
    }))

    // Update order values based on new position
    const reorderedTodos = newOrder.map((todo, index) => ({
      ...todo,
      order: index + 1,
    }))

    // Update local state with new order values
    set((state) => ({
      todos: {
        ...state.todos,
        [projectId]: reorderedTodos,
      },
    }))

    // Sync to server
    try {
      await syncService.updateTodosOrder(reorderedTodos)
    } catch (error) {
      logger.error("Failed to sync todo order:", error)
      // Could add retry logic here if needed
    }
  },

  reorderProjects: async (newOrder) => {
    // Update local state immediately for optimistic UI
    set(() => ({
      projects: newOrder,
    }))

    // Update order values based on new position
    const reorderedProjects = newOrder.map((project, index) => ({
      ...project,
      order: index + 1,
    }))

    // Update local state with new order values
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

  getProjectTodos: (projectId) => {
    const todos = get().todos[projectId] || []

    // Smart sorting: open todos first (by order), then completed todos (by completion date, newest first)
    return [...todos].sort((a, b) => {
      // If completion status is different, sort by completion (incomplete first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }

      // If both are completed, sort by completion date (newest first)
      if (a.completed && b.completed) {
        const aCompletedAt = a.completed_at || a.created_at
        const bCompletedAt = b.completed_at || b.created_at
        return new Date(bCompletedAt).getTime() - new Date(aCompletedAt).getTime()
      }

      // If both are incomplete, sort by order
      return a.order - b.order
    })
  },

  getProjectsSortedByOrder: () => {
    const projects = get().projects
    // Sort by order field for consistent display
    return [...projects].sort((a, b) => a.order - b.order)
  },

  getProject: (projectId) => {
    return get().projects.find((p) => p.id === projectId)
  },
}))
