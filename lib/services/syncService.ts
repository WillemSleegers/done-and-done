import { supabase, type Project, type Todo, type SyncState } from '@/lib/supabase'

// Re-export types for convenience
export type { Project, Todo, SyncState }

class SyncService {
  private retryTimeouts = new Map<string, NodeJS.Timeout>()
  
  private generateId(): string {
    return crypto.randomUUID()
  }

  private scheduleRetry(id: string, operation: () => Promise<void>, delay: number = 2000) {
    if (this.retryTimeouts.has(id)) {
      clearTimeout(this.retryTimeouts.get(id)!)
    }
    
    const timeout = setTimeout(async () => {
      this.retryTimeouts.delete(id)
      try {
        await operation()
      } catch {
        // Will be handled by the operation itself
      }
    }, delay)
    
    this.retryTimeouts.set(id, timeout)
  }

  async fetchInitialData(existingProjects: Project[] = [], existingTodos: Record<string, Todo[]> = {}): Promise<{ projects: Project[]; todos: Record<string, Todo[]> }> {
    try {
      const [projectsResult, todosResult] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
        supabase.from('todos').select('*').order('order', { ascending: true })
      ])

      if (projectsResult.error) throw projectsResult.error
      if (todosResult.error) throw todosResult.error

      // Create a map of existing projects by remoteId for quick lookup
      const existingByRemoteId = new Map<string, Project>()
      existingProjects.forEach(project => {
        if (project.remoteId) {
          existingByRemoteId.set(project.remoteId, project)
        }
      })

      const projects: Project[] = (projectsResult.data || []).map(remote => {
        // Check if we already have this project locally
        const existing = existingByRemoteId.get(remote.id)
        if (existing) {
          // Preserve existing local ID and update data
          return {
            ...existing,
            name: remote.name,
            notes: remote.notes,
            status: remote.status || 'active',
            priority: remote.priority || 'normal',
            created_at: remote.created_at,
            syncState: 'synced' as const,
            lastError: undefined
          }
        } else {
          // New remote project - use database ID directly
          return {
            id: remote.id,
            remoteId: remote.id,
            name: remote.name,
            notes: remote.notes,
            status: remote.status || 'active',
            priority: remote.priority || 'normal',
            created_at: remote.created_at,
            syncState: 'synced' as const
          }
        }
      })

      const remoteToLocalId = new Map<string, string>()
      projects.forEach(project => {
        if (project.remoteId) {
          remoteToLocalId.set(project.remoteId, project.id)
        }
      })

      // Create a map of existing todos by remoteId for quick lookup
      const existingTodosByRemoteId = new Map<string, Todo>()
      Object.values(existingTodos).flat().forEach(todo => {
        if (todo.remoteId) {
          existingTodosByRemoteId.set(todo.remoteId, todo)
        }
      })

      const todosByProject: Record<string, Todo[]> = {}
      todosResult.data?.forEach(remote => {
        if (!remote.project_id) return
        const localProjectId = remoteToLocalId.get(remote.project_id)
        if (localProjectId) {
          // Check if we already have this todo locally
          const existing = existingTodosByRemoteId.get(remote.id)
          const todo: Todo = existing ? {
            ...existing,
            text: remote.text,
            completed: remote.completed ?? false,
            project_id: localProjectId, // Update project_id in case project mapping changed
            created_at: remote.created_at,
            due_date: remote.due_date,
            order: remote.order,
            syncState: 'synced' as const,
            lastError: undefined
          } : {
            id: remote.id,
            remoteId: remote.id,
            text: remote.text,
            completed: remote.completed ?? false,
            project_id: localProjectId,
            created_at: remote.created_at,
            due_date: remote.due_date,
            order: remote.order,
            syncState: 'synced' as const
          }

          if (!todosByProject[localProjectId]) {
            todosByProject[localProjectId] = []
          }
          todosByProject[localProjectId].push(todo)
        }
      })

      projects.forEach(project => {
        if (!todosByProject[project.id]) {
          todosByProject[project.id] = []
        }
      })

      return { projects, todos: todosByProject }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      return { projects: [], todos: {} }
    }
  }

  async syncProject(project: Project, onUpdate: (updatedProject: Project) => void): Promise<void> {
    if (project.syncState === 'synced' || project.remoteId) return

    onUpdate({ ...project, syncState: 'syncing' })

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: project.name,
          notes: project.notes,
          status: project.status
        }])
        .select()
        .single()

      if (error) throw error

      onUpdate({ 
        ...project, 
        syncState: 'synced', 
        remoteId: data.id,
        lastError: undefined 
      })
    } catch (error) {
      const updatedProject = { 
        ...project, 
        syncState: 'failed' as const,
        lastError: error instanceof Error ? error.message : 'Sync failed'
      }
      onUpdate(updatedProject)
      
      this.scheduleRetry(project.id, () => this.syncProject(updatedProject, onUpdate))
    }
  }

  async syncTodo(
    todo: Todo, 
    projectRemoteId: string | undefined,
    onUpdate: (updatedTodo: Todo) => void
  ): Promise<void> {
    if (todo.syncState === 'synced' || todo.remoteId) return
    if (!projectRemoteId) {
      this.scheduleRetry(todo.id, () => this.syncTodo(todo, projectRemoteId, onUpdate), 1000)
      return
    }

    onUpdate({ ...todo, syncState: 'syncing' })

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{
          text: todo.text,
          completed: todo.completed,
          project_id: projectRemoteId,
          due_date: todo.due_date,
          order: todo.order
        }])
        .select()
        .single()

      if (error) throw error

      onUpdate({ 
        ...todo, 
        syncState: 'synced', 
        remoteId: data.id,
        lastError: undefined 
      })
    } catch (error) {
      const updatedTodo = { 
        ...todo, 
        syncState: 'failed' as const,
        lastError: error instanceof Error ? error.message : 'Sync failed'
      }
      onUpdate(updatedTodo)
      
      this.scheduleRetry(todo.id, () => this.syncTodo(updatedTodo, projectRemoteId, onUpdate))
    }
  }

  async updateTodo(
    todo: Todo,
    updates: Partial<Pick<Todo, 'text' | 'completed' | 'due_date' | 'order'>>,
    onUpdate: (updatedTodo: Todo) => void
  ): Promise<void> {
    if (!todo.remoteId) return

    onUpdate({ ...todo, syncState: 'syncing' })

    try {
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', todo.remoteId)

      if (error) throw error

      onUpdate({ ...todo, syncState: 'synced', lastError: undefined })
    } catch (error) {
      const updatedTodo = { 
        ...todo, 
        syncState: 'failed' as const,
        lastError: error instanceof Error ? error.message : 'Update failed'
      }
      onUpdate(updatedTodo)
      
      this.scheduleRetry(todo.id, () => this.updateTodo(updatedTodo, updates, onUpdate))
    }
  }

  async deleteTodo(todo: Todo): Promise<void> {
    if (!todo.remoteId) return

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todo.remoteId)

    if (error) {
      throw new Error(error.message)
    }
  }

  async updateTodosOrder(todos: Pick<Todo, 'remoteId' | 'order'>[]): Promise<void> {
    // Update order for multiple todos efficiently
    const updates = todos
      .filter(todo => todo.remoteId)
      .map(todo => ({ id: todo.remoteId!, order: todo.order }))

    if (updates.length === 0) return

    try {
      // Use Promise.all for parallel updates for better performance
      await Promise.all(
        updates.map(update =>
          supabase
            .from('todos')
            .update({ order: update.order })
            .eq('id', update.id)
        )
      )
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update todo order')
    }
  }

  async updateProject(project: Project, updates: Partial<Pick<Project, 'name' | 'notes' | 'status' | 'priority'>>, onUpdate: (updatedProject: Project) => void): Promise<void> {
    if (!project.remoteId) return

    onUpdate({ ...project, ...updates, syncState: 'syncing' })

    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', project.remoteId)

      if (error) throw error

      onUpdate({ ...project, ...updates, syncState: 'synced', lastError: undefined })
    } catch (error) {
      const updatedProject = { 
        ...project, 
        syncState: 'failed' as const,
        lastError: error instanceof Error ? error.message : 'Update failed'
      }
      onUpdate(updatedProject)
      
      this.scheduleRetry(project.id, () => this.updateProject(updatedProject, updates, onUpdate))
    }
  }

  async deleteProject(project: Project): Promise<void> {
    if (!project.remoteId) return

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.remoteId)

    if (error) {
      throw new Error(error.message)
    }
  }

  cleanup() {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
  }
}

export const syncService = new SyncService()