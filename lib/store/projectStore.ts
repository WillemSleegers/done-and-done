import { create } from 'zustand'
import { syncService, type Project, type Todo } from '@/lib/services/syncService'

interface ProjectState {
  projects: Project[]
  todos: Record<string, Todo[]>
  todoCounts: Record<string, { total: number; completed: number }>
  isLoading: boolean
}

interface ProjectActions {
  fetchInitialData: () => Promise<void>
  refreshData: () => Promise<void>

  addProject: (data: Omit<Project, 'created_at' | 'syncState' | 'remoteId'> & { id?: string }) => Promise<Project>
  updateProject: (projectId: string, updates: Partial<Pick<Project, 'name' | 'notes' | 'status' | 'priority'>>) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  retryFailedProject: (projectId: string) => Promise<void>

  addTodo: (projectId: string, text: string) => Promise<Todo>
  updateTodo: (todoId: string, updates: Partial<Pick<Todo, 'text' | 'completed' | 'due_date'>>) => Promise<void>
  deleteTodo: (todoId: string, projectId: string) => Promise<void>
  retryFailedTodo: (todoId: string, projectId: string) => Promise<void>

  getProjectTodos: (projectId: string) => Todo[]
}

type ProjectStore = ProjectState & ProjectActions

const generateId = () => crypto.randomUUID()

const updateTodoCounts = (todos: Record<string, Todo[]>) => {
  const counts: Record<string, { total: number; completed: number }> = {}
  Object.entries(todos).forEach(([projectId, projectTodos]) => {
    const total = projectTodos.length
    const completed = projectTodos.filter(todo => todo.completed).length
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
      const { projects, todos } = await syncService.fetchInitialData()
      const todoCounts = updateTodoCounts(todos)
      set({ projects, todos, todoCounts, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      set({ isLoading: false })
    }
  },

  refreshData: async () => {
    await get().fetchInitialData()
  },

  addProject: async (projectData) => {
    const newProject: Project = {
      ...projectData,
      id: projectData.id || generateId(),
      created_at: new Date().toISOString(),
      syncState: 'local'
    }

    set(state => ({
      projects: [...state.projects, newProject],
      todos: { ...state.todos, [newProject.id]: [] }
    }))

    syncService.syncProject(newProject, (updatedProject) => {
      set(state => ({
        projects: state.projects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        )
      }))
    })

    return newProject
  },

  updateProject: async (projectId, updates) => {
    const project = get().projects.find(p => p.id === projectId)
    if (!project) return

    set(state => ({
      projects: state.projects.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      )
    }))

    if (project.remoteId) {
      syncService.updateProject(project, updates, (syncedProject) => {
        set(state => ({
          projects: state.projects.map(p => 
            p.id === syncedProject.id ? syncedProject : p
          )
        }))
      })
    }
  },

  deleteProject: async (projectId) => {
    const { projects, todos } = get()
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    set(state => {
      const newTodos = { ...state.todos }
      delete newTodos[projectId]
      const todoCounts = updateTodoCounts(newTodos)
      
      return {
        projects: state.projects.filter(p => p.id !== projectId),
        todos: newTodos,
        todoCounts
      }
    })

    try {
      await syncService.deleteProject(project)
    } catch (error) {
      set(state => ({
        projects: [...state.projects, project],
        todos: { ...state.todos, [projectId]: todos[projectId] || [] }
      }))
      throw error
    }
  },

  retryFailedProject: async (projectId) => {
    const project = get().projects.find(p => p.id === projectId)
    if (!project || project.syncState !== 'failed') return

    syncService.syncProject(project, (updatedProject) => {
      set(state => ({
        projects: state.projects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        )
      }))
    })
  },

  addTodo: async (projectId, text) => {
    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      project_id: projectId,
      created_at: new Date().toISOString(),
      due_date: null,
      syncState: 'local'
    }

    set(state => {
      const newTodos = {
        ...state.todos,
        [projectId]: [newTodo, ...(state.todos[projectId] || [])]
      }
      const todoCounts = updateTodoCounts(newTodos)
      return { todos: newTodos, todoCounts }
    })

    const project = get().projects.find(p => p.id === projectId)
    syncService.syncTodo(newTodo, project?.remoteId, (updatedTodo) => {
      set(state => {
        const newTodos = {
          ...state.todos,
          [projectId]: state.todos[projectId]?.map(t => 
            t.id === updatedTodo.id ? updatedTodo : t
          ) || []
        }
        const todoCounts = updateTodoCounts(newTodos)
        return { todos: newTodos, todoCounts }
      })
    })

    return newTodo
  },

  updateTodo: async (todoId, updates) => {
    const { todos } = get()
    const projectId = Object.keys(todos).find(pid => 
      todos[pid]?.some(t => t.id === todoId)
    )
    if (!projectId) return

    const todo = todos[projectId]?.find(t => t.id === todoId)
    if (!todo) return

    set(state => {
      const newTodos = {
        ...state.todos,
        [projectId]: state.todos[projectId]?.map(t => 
          t.id === todoId ? { ...t, ...updates } : t
        ) || []
      }
      const todoCounts = updateTodoCounts(newTodos)
      return { todos: newTodos, todoCounts }
    })

    if (todo.remoteId) {
      syncService.updateTodo({ ...todo, ...updates }, updates, (updatedTodo) => {
        set(state => {
          const newTodos = {
            ...state.todos,
            [projectId]: state.todos[projectId]?.map(t => 
              t.id === updatedTodo.id ? updatedTodo : t
            ) || []
          }
          return { todos: newTodos }
        })
      })
    }
  },

  deleteTodo: async (todoId, projectId) => {
    const todo = get().todos[projectId]?.find(t => t.id === todoId)
    if (!todo) return

    set(state => {
      const newTodos = {
        ...state.todos,
        [projectId]: state.todos[projectId]?.filter(t => t.id !== todoId) || []
      }
      const todoCounts = updateTodoCounts(newTodos)
      return { todos: newTodos, todoCounts }
    })

    try {
      await syncService.deleteTodo(todo)
    } catch (error) {
      set(state => {
        const newTodos = {
          ...state.todos,
          [projectId]: [...(state.todos[projectId] || []), todo].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }
        const todoCounts = updateTodoCounts(newTodos)
        return { todos: newTodos, todoCounts }
      })
      throw error
    }
  },

  retryFailedTodo: async (todoId, projectId) => {
    const { todos, projects } = get()
    const todo = todos[projectId]?.find(t => t.id === todoId)
    if (!todo || todo.syncState !== 'failed') return

    const project = projects.find(p => p.id === projectId)
    
    if (todo.remoteId) {
      syncService.updateTodo(todo, { text: todo.text, completed: todo.completed }, (updatedTodo) => {
        set(state => {
          const newTodos = {
            ...state.todos,
            [projectId]: state.todos[projectId]?.map(t => 
              t.id === updatedTodo.id ? updatedTodo : t
            ) || []
          }
          return { todos: newTodos }
        })
      })
    } else {
      syncService.syncTodo(todo, project?.remoteId, (updatedTodo) => {
        set(state => {
          const newTodos = {
            ...state.todos,
            [projectId]: state.todos[projectId]?.map(t => 
              t.id === updatedTodo.id ? updatedTodo : t
            ) || []
          }
          const todoCounts = updateTodoCounts(newTodos)
          return { todos: newTodos, todoCounts }
        })
      })
    }
  },

  getProjectTodos: (projectId) => {
    return get().todos[projectId] || []
  }
}))