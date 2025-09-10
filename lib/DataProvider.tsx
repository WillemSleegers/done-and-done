'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, type Project, type Todo } from './supabase'

// Generate stable local IDs
const generateLocalId = () => crypto.randomUUID()

interface DataContextType {
  // Data
  projects: Project[]
  todos: Record<string, Todo[]> // projectId -> todos (using local project IDs)
  todoCounts: Record<string, { total: number; completed: number }>
  
  // Loading states
  isLoading: boolean
  
  // Actions
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'syncState' | 'remoteId'>) => Promise<Project>
  addTodo: (projectId: string, text: string) => Promise<Todo>
  updateTodo: (todoId: string, updates: Partial<Pick<Todo, 'text' | 'completed'>>) => Promise<void>
  deleteTodo: (todoId: string, projectId: string) => Promise<void>
  retryFailedTodo: (todoId: string, projectId: string) => Promise<void>
  retryFailedProject: (projectId: string) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  
  // Utilities
  getProjectTodos: (projectId: string) => Todo[]
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [todos, setTodos] = useState<Record<string, Todo[]>>({})
  const [todoCounts, setTodoCounts] = useState<Record<string, { total: number; completed: number }>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Calculate todo counts from cached data
  const updateTodoCounts = useCallback((todosData: Record<string, Todo[]>) => {
    const counts: Record<string, { total: number; completed: number }> = {}
    
    Object.entries(todosData).forEach(([projectId, projectTodos]) => {
      const total = projectTodos.length
      const completed = projectTodos.filter(todo => todo.completed).length
      counts[projectId] = { total, completed }
    })
    
    setTodoCounts(counts)
  }, [])

  // Initial data fetch
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true })

      if (projectsError) throw projectsError

      // Fetch all todos at once
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (todosError) throw todosError

      // Create local projects with stable IDs and remote ID mapping
      const localProjects: Project[] = (projectsData || []).map(remoteProject => ({
        id: generateLocalId(), // Stable local ID
        remoteId: remoteProject.id, // Store server ID
        name: remoteProject.name,
        description: remoteProject.description,
        created_at: remoteProject.created_at,
        syncState: 'synced' as const
      }))

      // Create mapping from remote project ID to local project ID
      const remoteToLocalProjectId = new Map<string, string>()
      localProjects.forEach((project) => {
        if (project.remoteId) {
          remoteToLocalProjectId.set(project.remoteId, project.id)
        }
      })

      // Create local todos with stable IDs and remote ID mapping
      const todosByProject: Record<string, Todo[]> = {}
      todosData?.forEach(remoteTodo => {
        const localProjectId = remoteToLocalProjectId.get(remoteTodo.project_id)
        if (localProjectId) {
          const localTodo: Todo = {
            id: generateLocalId(), // Stable local ID
            remoteId: remoteTodo.id, // Store server ID
            text: remoteTodo.text,
            completed: remoteTodo.completed,
            project_id: localProjectId, // Reference local project ID
            created_at: remoteTodo.created_at,
            syncState: 'synced' as const
          }
          
          if (!todosByProject[localProjectId]) {
            todosByProject[localProjectId] = []
          }
          todosByProject[localProjectId].push(localTodo)
        }
      })

      // Ensure all projects have an entry (even if empty)
      localProjects.forEach(project => {
        if (!todosByProject[project.id]) {
          todosByProject[project.id] = []
        }
      })

      setProjects(localProjects)
      setTodos(todosByProject)
      updateTodoCounts(todosByProject)

    } catch {
      // Error fetching initial data - will retry on next action
    } finally {
      setIsLoading(false)
    }
  }, [updateTodoCounts])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  // Background sync function for projects
  const syncProjectToDatabase = useCallback(async (localId: string) => {
    // Get current project state
    setProjects(prev => {
      const project = prev.find(p => p.id === localId)
      if (!project || project.syncState === 'synced' || project.remoteId) return prev

      // Mark as syncing and start async operation
      const updatedProjects = prev.map(p => 
        p.id === localId ? { ...p, syncState: 'syncing' as const } : p
      )

      // Start sync operation in background
      ;(async () => {
        try {
          const { data, error } = await supabase
            .from('projects')
            .insert([{
              name: project.name,
              description: project.description
            }])
            .select()
            .single()

          if (error) throw error

          // Mark as synced and store remote ID
          setProjects(prev => prev.map(p => 
            p.id === localId 
              ? { ...p, syncState: 'synced' as const, remoteId: data.id }
              : p
          ))
        } catch (error) {
          // Mark as failed
          setProjects(prev => prev.map(p => 
            p.id === localId 
              ? { 
                  ...p, 
                  syncState: 'failed' as const, 
                  lastError: error instanceof Error ? error.message : 'Sync failed'
                } 
              : p
          ))

          // Auto-retry after delay
          setTimeout(() => syncProjectToDatabase(localId), 2000)
        }
      })()

      return updatedProjects
    })
  }, [])

  // Background sync function for todos  
  const syncTodoToDatabase = useCallback(async (localId: string, projectId: string) => {
    // Get current state and check if we need to sync
    let shouldRetry = false
    
    setTodos(prev => {
      const todo = prev[projectId]?.find(t => t.id === localId)
      if (!todo || todo.syncState === 'synced' || todo.remoteId) return prev
      
      // Check if project is ready (needs to be done inside the state setter to get current projects)
      setProjects(projectsPrev => {
        const project = projectsPrev.find(p => p.id === projectId)
        if (!project?.remoteId) {
          // Wait for project to sync first, then retry
          shouldRetry = true
          return projectsPrev
        }

        // Start sync operation in background
        ;(async () => {
          try {
            const { data, error } = await supabase
              .from('todos')
              .insert([{ 
                text: todo.text, 
                completed: todo.completed,
                project_id: project.remoteId // Use remote project ID for database
              }])
              .select()
              .single()

            if (error) throw error

            // Mark as synced and store remote ID
            setTodos(prev => {
              const newTodos = {
                ...prev,
                [projectId]: (prev[projectId] || []).map(t => 
                  t.id === localId 
                    ? { ...t, syncState: 'synced' as const, remoteId: data.id }
                    : t
                )
              }
              updateTodoCounts(newTodos)
              return newTodos
            })
          } catch (error) {
            // Mark as failed
            setTodos(prev => {
              const newTodos = {
                ...prev,
                [projectId]: (prev[projectId] || []).map(t => 
                  t.id === localId 
                    ? { 
                        ...t, 
                        syncState: 'failed' as const,
                        lastError: error instanceof Error ? error.message : 'Sync failed'
                      }
                    : t
                )
              }
              updateTodoCounts(newTodos)
              return newTodos
            })

            // Auto-retry after delay
            setTimeout(() => syncTodoToDatabase(localId, projectId), 2000)
          }
        })()

        return projectsPrev
      })

      if (shouldRetry) {
        setTimeout(() => syncTodoToDatabase(localId, projectId), 1000)
        return prev
      }

      // Mark as syncing
      const newTodos = {
        ...prev,
        [projectId]: (prev[projectId] || []).map(t => 
          t.id === localId ? { ...t, syncState: 'syncing' as const } : t
        )
      }
      updateTodoCounts(newTodos)
      return newTodos
    })
  }, [updateTodoCounts])

  // CRUD operations with stable IDs
  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'created_at' | 'syncState' | 'remoteId'>) => {
    const localId = generateLocalId()
    const newProject: Project = {
      id: localId,
      remoteId: undefined, // No remote ID yet
      created_at: new Date().toISOString(),
      syncState: 'local', // Start as local-only
      ...projectData
    }

    // Optimistic update - add immediately as local-only
    setProjects(prev => [...prev, newProject])
    setTodos(prev => ({ ...prev, [localId]: [] }))

    // Start background sync process
    syncProjectToDatabase(localId)

    return newProject
  }, [syncProjectToDatabase])

  const addTodo = useCallback(async (projectId: string, text: string) => {
    const localId = generateLocalId()
    const newTodo: Todo = {
      id: localId,
      remoteId: undefined, // No remote ID yet
      text,
      completed: false,
      project_id: projectId, // Uses local project ID
      created_at: new Date().toISOString(),
      syncState: 'local' // Start as local-only
    }

    // Optimistic update - add immediately as local-only
    setTodos(prev => {
      const newTodos = {
        ...prev,
        [projectId]: [newTodo, ...(prev[projectId] || [])]
      }
      updateTodoCounts(newTodos)
      return newTodos
    })

    // Start background sync process
    syncTodoToDatabase(localId, projectId)

    return newTodo
  }, [syncTodoToDatabase, updateTodoCounts])

  // Background sync function for todo updates
  const syncTodoUpdateToDatabase = useCallback(async (
    localId: string, 
    projectId: string, 
    updates: Partial<Pick<Todo, 'text' | 'completed'>>
  ) => {
    const todo = todos[projectId]?.find(t => t.id === localId)
    if (!todo?.remoteId) return

    // Mark as syncing
    setTodos(prev => {
      const newTodos = {
        ...prev,
        [projectId]: (prev[projectId] || []).map(t => 
          t.id === localId ? { ...t, syncState: 'syncing' } : t
        )
      }
      updateTodoCounts(newTodos)
      return newTodos
    })

    try {
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', todo.remoteId)

      if (error) throw error

      // Mark as synced
      setTodos(prev => {
        const newTodos = {
          ...prev,
          [projectId]: (prev[projectId] || []).map(t => 
            t.id === localId ? { ...t, syncState: 'synced' } : t
          )
        }
        updateTodoCounts(newTodos)
        return newTodos
      })
    } catch (error) {
      // Mark as failed
      setTodos(prev => {
        const newTodos = {
          ...prev,
          [projectId]: (prev[projectId] || []).map(t => 
            t.id === localId 
              ? { 
                  ...t, 
                  syncState: 'failed',
                  lastError: error instanceof Error ? error.message : 'Update failed'
                }
              : t
          )
        }
        updateTodoCounts(newTodos)
        return newTodos
      })

      // Auto-retry after delay
      setTimeout(() => syncTodoUpdateToDatabase(localId, projectId, updates), 2000)
    }
  }, [todos, updateTodoCounts])

  const updateTodo = useCallback(async (todoId: string, updates: Partial<Pick<Todo, 'text' | 'completed'>>) => {
    // Find which project this todo belongs to
    const projectId = Object.entries(todos).find(([, projectTodos]) => 
      projectTodos.some(t => t.id === todoId)
    )?.[0]

    if (!projectId) return

    const todo = todos[projectId]?.find(t => t.id === todoId)
    if (!todo) return

    // Optimistic update - apply changes immediately
    setTodos(prev => {
      const newTodos = {
        ...prev,
        [projectId]: (prev[projectId] || []).map(t => 
          t.id === todoId ? { ...t, ...updates } : t
        )
      }
      updateTodoCounts(newTodos)
      return newTodos
    })

    // Start background sync if todo is synced (has remoteId)
    if (todo.remoteId) {
      syncTodoUpdateToDatabase(todoId, projectId, updates)
    }
  }, [todos, syncTodoUpdateToDatabase, updateTodoCounts])

  const deleteTodo = useCallback(async (todoId: string, projectId: string) => {
    const todoToDelete = todos[projectId]?.find(t => t.id === todoId)
    if (!todoToDelete) return

    // Optimistic update - remove immediately
    setTodos(prev => {
      const newTodos = {
        ...prev,
        [projectId]: (prev[projectId] || []).filter(t => t.id !== todoId)
      }
      updateTodoCounts(newTodos)
      return newTodos
    })

    // Only sync to database if todo has been synced (has remoteId)
    if (todoToDelete.remoteId) {
      try {
        const { error } = await supabase
          .from('todos')
          .delete()
          .eq('id', todoToDelete.remoteId)

        if (error) throw error
      } catch (error) {
        // Revert optimistic update on error
        setTodos(prev => {
          const newTodos = {
            ...prev,
            [projectId]: [...(prev[projectId] || []), todoToDelete].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          }
          updateTodoCounts(newTodos)
          return newTodos
        })
        
        // Todo deletion will retry in background
        throw new Error(error instanceof Error ? error.message : 'Failed to delete todo')
      }
    }
  }, [todos, updateTodoCounts])

  const deleteProject = useCallback(async (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId)
    if (!projectToDelete) return

    // Optimistic update - remove project and its todos immediately
    setProjects(prev => prev.filter(p => p.id !== projectId))
    setTodos(prev => {
      const newTodos = { ...prev }
      delete newTodos[projectId]
      updateTodoCounts(newTodos)
      return newTodos
    })

    // Only sync to database if project has been synced (has remoteId)
    if (projectToDelete.remoteId) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectToDelete.remoteId)

        if (error) throw error
      } catch (error) {
        // Restore project and todos if deletion failed
        setProjects(prev => [...prev, projectToDelete])
        setTodos(prev => ({
          ...prev,
          [projectId]: [] // Restore empty todos array (todos would have been deleted from DB anyway)
        }))
        
        // Project deletion will retry in background
        throw new Error(error instanceof Error ? error.message : 'Failed to delete project')
      }
    }
  }, [projects, updateTodoCounts])

  // Simple retry functions for the new stable ID system
  const retryFailedTodo = useCallback(async (todoId: string, projectId: string) => {
    const todo = todos[projectId]?.find(t => t.id === todoId)
    if (!todo || todo.syncState !== 'failed') return

    if (todo.remoteId) {
      // Todo exists in database, retry the last update
      await syncTodoUpdateToDatabase(todoId, projectId, { 
        text: todo.text, 
        completed: todo.completed 
      })
    } else {
      // Todo doesn't exist in database, retry creation
      await syncTodoToDatabase(todoId, projectId)
    }
  }, [todos, syncTodoUpdateToDatabase, syncTodoToDatabase])

  const retryFailedProject = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project || project.syncState !== 'failed') return

    // Retry syncing the project to database
    await syncProjectToDatabase(projectId)
  }, [projects, syncProjectToDatabase])

  const getProjectTodos = useCallback((projectId: string) => {
    return todos[projectId] || []
  }, [todos])

  const refreshData = useCallback(async () => {
    await fetchInitialData()
  }, [fetchInitialData])

  const value: DataContextType = {
    projects,
    todos,
    todoCounts,
    isLoading,
    addProject,
    addTodo,
    updateTodo,
    deleteTodo,
    retryFailedTodo,
    retryFailedProject,
    deleteProject,
    getProjectTodos,
    refreshData
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}