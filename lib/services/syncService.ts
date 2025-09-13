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

  async fetchInitialData(): Promise<{ projects: Project[]; todos: Record<string, Todo[]> }> {
    try {
      const [projectsResult, todosResult] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
        supabase.from('todos').select('*').order('created_at', { ascending: false })
      ])

      if (projectsResult.error) throw projectsResult.error
      if (todosResult.error) throw todosResult.error

      const projects: Project[] = (projectsResult.data || []).map(remote => ({
        id: this.generateId(),
        remoteId: remote.id,
        name: remote.name,
        description: remote.description,
        status: remote.status || 'active',
        priority: remote.priority || 'normal',
        created_at: remote.created_at,
        syncState: 'synced' as const
      }))

      const remoteToLocalId = new Map<string, string>()
      projects.forEach(project => {
        if (project.remoteId) {
          remoteToLocalId.set(project.remoteId, project.id)
        }
      })

      const todosByProject: Record<string, Todo[]> = {}
      todosResult.data?.forEach(remote => {
        if (!remote.project_id) return
        const localProjectId = remoteToLocalId.get(remote.project_id)
        if (localProjectId) {
          const todo: Todo = {
            id: this.generateId(),
            remoteId: remote.id,
            text: remote.text,
            completed: remote.completed ?? false,
            project_id: localProjectId,
            created_at: remote.created_at,
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
          description: project.description,
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
          project_id: projectRemoteId
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
    updates: Partial<Pick<Todo, 'text' | 'completed'>>,
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

  async updateProject(project: Project, updates: Partial<Pick<Project, 'name' | 'description' | 'status' | 'priority'>>, onUpdate: (updatedProject: Project) => void): Promise<void> {
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