import { SYNC_TIMING } from "@/lib/constants"
import { logger } from "@/lib/logger"
import { type Project, supabase, type SyncState,type Todo } from "@/lib/supabase"

// Re-export types for convenience
export type { Project, SyncState,Todo }

class SyncService {
  private retryTimeouts = new Map<string, NodeJS.Timeout>()
  private retryAttempts = new Map<string, number>()

  private generateId(): string {
    return crypto.randomUUID()
  }

  private scheduleRetry(
    id: string,
    operation: () => Promise<void>,
    baseDelay: number = SYNC_TIMING.BASE_RETRY_DELAY
  ) {
    if (this.retryTimeouts.has(id)) {
      clearTimeout(this.retryTimeouts.get(id)!)
    }

    // Exponential backoff: 10s, 30s, 60s, then 60s intervals
    const attempts = this.retryAttempts.get(id) || 0
    const delay = Math.min(baseDelay * Math.pow(2, attempts), SYNC_TIMING.MAX_RETRY_DELAY)

    const timeout = setTimeout(async () => {
      this.retryTimeouts.delete(id)
      this.retryAttempts.set(id, attempts + 1)
      try {
        await operation()
        // Success - reset attempt counter
        this.retryAttempts.delete(id)
      } catch {
        // Will be handled by the operation itself
      }
    }, delay)

    this.retryTimeouts.set(id, timeout)
  }

  async fetchInitialData(
    existingProjects: Project[] = [],
    existingTodos: Record<string, Todo[]> = {}
  ): Promise<{ projects: Project[]; todos: Record<string, Todo[]> }> {
    logger.sync("Fetching initial data from database")

    try {
      // Add timeout to prevent infinite hangs
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Database connection timeout")),
          SYNC_TIMING.CONNECTION_TIMEOUT
        )
      })

      const [projectsResult, todosResult] = await Promise.race([
        Promise.all([
          supabase.from("projects").select("*").order("order", { ascending: true }),
          supabase.from("todos").select("*").order("order", { ascending: true }),
        ]),
        timeoutPromise,
      ])

      if (projectsResult.error) throw projectsResult.error
      if (todosResult.error) throw todosResult.error

      // Create a map of existing projects by remoteId for quick lookup
      const existingByRemoteId = new Map<string, Project>()
      existingProjects.forEach((project) => {
        if (project.remoteId) {
          existingByRemoteId.set(project.remoteId, project)
        }
      })

      const projects: Project[] = (projectsResult.data || []).map((remote) => {
        // Always use the database ID as the stable identifier
        // This ensures URLs remain consistent across sessions
        const project = {
          id: remote.id,
          remoteId: remote.id,
          name: remote.name,
          notes: remote.notes,
          status: remote.status || "active",
          priority: remote.priority || "normal",
          created_at: remote.created_at,
          order: remote.order,
          syncState: "synced" as const,
          lastError: undefined,
        }
        return project
      })

      const remoteToLocalId = new Map<string, string>()
      projects.forEach((project) => {
        if (project.remoteId) {
          remoteToLocalId.set(project.remoteId, project.id)
        }
      })

      // Create a map of existing todos by remoteId for quick lookup
      const existingTodosByRemoteId = new Map<string, Todo>()
      Object.values(existingTodos)
        .flat()
        .forEach((todo) => {
          if (todo.remoteId) {
            existingTodosByRemoteId.set(todo.remoteId, todo)
          }
        })

      const todosByProject: Record<string, Todo[]> = {}
      todosResult.data?.forEach((remote) => {
        if (!remote.project_id) return
        const localProjectId = remoteToLocalId.get(remote.project_id)
        if (localProjectId) {
          // Check if we already have this todo locally
          const existing = existingTodosByRemoteId.get(remote.id)
          const todo: Todo = existing
            ? {
                ...existing,
                text: remote.text,
                completed: remote.completed ?? false,
                completed_at: remote.completed_at,
                project_id: localProjectId, // Update project_id in case project mapping changed
                created_at: remote.created_at,
                due_date: remote.due_date,
                order: remote.order,
                syncState: "synced" as const,
                lastError: undefined,
              }
            : {
                id: remote.id,
                remoteId: remote.id,
                text: remote.text,
                completed: remote.completed ?? false,
                completed_at: remote.completed_at,
                project_id: localProjectId,
                created_at: remote.created_at,
                due_date: remote.due_date,
                order: remote.order,
                syncState: "synced" as const,
              }

          if (!todosByProject[localProjectId]) {
            todosByProject[localProjectId] = []
          }
          todosByProject[localProjectId].push(todo)
        }
      })

      projects.forEach((project) => {
        if (!todosByProject[project.id]) {
          todosByProject[project.id] = []
        }
      })

      logger.sync("Initial data fetched successfully:", {
        projectCount: projects.length,
        todoCount: Object.values(todosByProject).flat().length,
      })

      return { projects, todos: todosByProject }
    } catch (error) {
      logger.error("Failed to fetch initial data:", error)

      // If it's a timeout or auth error, it might be a stale session
      if (
        error instanceof Error &&
        (error.message.includes("timeout") ||
          error.message.includes("JWT") ||
          error.message.includes("authentication"))
      ) {
        logger.warn("Auth-related error detected, clearing session")
        // Import supabase locally to avoid circular deps
        const { supabase } = await import("@/lib/supabase")
        await supabase.auth.signOut({ scope: "local" })
      }

      return { projects: [], todos: {} }
    }
  }

  async syncProject(project: Project, onUpdate: (updatedProject: Project) => void): Promise<void> {
    if (project.syncState === "synced" || project.remoteId) return

    logger.sync("Syncing project to database:", {
      projectId: project.id,
      projectName: project.name,
    })

    onUpdate({ ...project, syncState: "syncing" })

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: project.name,
            notes: project.notes,
            status: project.status,
            priority: project.priority,
            order: project.order,
          },
        ])
        .select()
        .single()

      if (error) throw error

      logger.sync("Project synced successfully:", {
        projectId: project.id,
        remoteId: data.id,
      })

      onUpdate({
        ...project,
        syncState: "synced",
        remoteId: data.id,
        lastError: undefined,
      })
    } catch (error) {
      logger.error("Failed to sync project:", {
        projectId: project.id,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      const updatedProject = {
        ...project,
        syncState: "failed" as const,
        lastError: error instanceof Error ? error.message : "Sync failed",
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
    if (todo.syncState === "synced" || todo.remoteId) return
    if (!projectRemoteId) {
      logger.sync("Retrying todo sync - waiting for project remote ID:", {
        todoId: todo.id,
        todoText: todo.text,
      })
      this.scheduleRetry(todo.id, () => this.syncTodo(todo, projectRemoteId, onUpdate), 1000)
      return
    }

    logger.sync("Syncing todo to database:", {
      todoId: todo.id,
      todoText: todo.text,
      projectRemoteId,
    })

    onUpdate({ ...todo, syncState: "syncing" })

    try {
      const { data, error } = await supabase
        .from("todos")
        .insert([
          {
            text: todo.text,
            completed: todo.completed,
            project_id: projectRemoteId,
            due_date: todo.due_date,
            order: todo.order,
          },
        ])
        .select()
        .single()

      if (error) throw error

      logger.sync("Todo synced successfully:", {
        todoId: todo.id,
        remoteId: data.id,
      })

      onUpdate({
        ...todo,
        syncState: "synced",
        remoteId: data.id,
        lastError: undefined,
      })
    } catch (error) {
      logger.error("Failed to sync todo:", {
        todoId: todo.id,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      const updatedTodo = {
        ...todo,
        syncState: "failed" as const,
        lastError: error instanceof Error ? error.message : "Sync failed",
      }
      onUpdate(updatedTodo)

      this.scheduleRetry(todo.id, () => this.syncTodo(updatedTodo, projectRemoteId, onUpdate))
    }
  }

  async updateTodo(
    todo: Todo,
    updates: Partial<Pick<Todo, "text" | "completed" | "due_date" | "order">>,
    onUpdate: (updatedTodo: Todo) => void
  ): Promise<void> {
    if (!todo.remoteId) return

    logger.sync("Updating todo in database:", {
      todoId: todo.id,
      remoteId: todo.remoteId,
      updates,
    })

    onUpdate({ ...todo, syncState: "syncing" })

    try {
      const { error } = await supabase.from("todos").update(updates).eq("id", todo.remoteId)

      if (error) throw error

      logger.sync("Todo updated successfully:", {
        todoId: todo.id,
        remoteId: todo.remoteId,
      })

      onUpdate({ ...todo, syncState: "synced", lastError: undefined })
    } catch (error) {
      logger.error("Failed to update todo:", {
        todoId: todo.id,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      const updatedTodo = {
        ...todo,
        syncState: "failed" as const,
        lastError: error instanceof Error ? error.message : "Update failed",
      }
      onUpdate(updatedTodo)

      this.scheduleRetry(todo.id, () => this.updateTodo(updatedTodo, updates, onUpdate))
    }
  }

  async deleteTodo(todo: Todo): Promise<void> {
    if (!todo.remoteId) return

    logger.sync("Deleting todo from database:", {
      todoId: todo.id,
      remoteId: todo.remoteId,
      todoText: todo.text,
    })

    const { error } = await supabase.from("todos").delete().eq("id", todo.remoteId)

    if (error) {
      logger.error("Failed to delete todo:", {
        todoId: todo.id,
        error: error.message,
      })
      throw new Error(error.message)
    }

    logger.sync("Todo deleted successfully:", {
      todoId: todo.id,
      remoteId: todo.remoteId,
    })
  }

  async updateTodosOrder(todos: Pick<Todo, "remoteId" | "order">[]): Promise<void> {
    // Update order for multiple todos efficiently
    const updates = todos
      .filter((todo) => todo.remoteId)
      .map((todo) => ({ id: todo.remoteId!, order: todo.order }))

    if (updates.length === 0) return

    try {
      // Use Promise.all for parallel updates for better performance
      await Promise.all(
        updates.map((update) =>
          supabase.from("todos").update({ order: update.order }).eq("id", update.id)
        )
      )
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update todo order")
    }
  }

  async updateProjectsOrder(projects: Pick<Project, "remoteId" | "order">[]): Promise<void> {
    // Update order for multiple projects efficiently
    const updates = projects
      .filter((project) => project.remoteId)
      .map((project) => ({ id: project.remoteId!, order: project.order }))

    if (updates.length === 0) return

    try {
      // Use Promise.all for parallel updates for better performance
      await Promise.all(
        updates.map((update) =>
          supabase.from("projects").update({ order: update.order }).eq("id", update.id)
        )
      )
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update project order")
    }
  }

  async updateProject(
    project: Project,
    updates: Partial<Pick<Project, "name" | "notes" | "status" | "priority" | "order">>,
    onUpdate: (updatedProject: Project) => void
  ): Promise<void> {
    if (!project.remoteId) return

    logger.sync("Updating project in database:", {
      projectId: project.id,
      remoteId: project.remoteId,
      updates,
    })

    onUpdate({ ...project, ...updates, syncState: "syncing" })

    try {
      const { error } = await supabase.from("projects").update(updates).eq("id", project.remoteId)

      if (error) throw error

      logger.sync("Project updated successfully:", {
        projectId: project.id,
        remoteId: project.remoteId,
      })

      onUpdate({ ...project, ...updates, syncState: "synced", lastError: undefined })
    } catch (error) {
      logger.error("Failed to update project:", {
        projectId: project.id,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      const updatedProject = {
        ...project,
        syncState: "failed" as const,
        lastError: error instanceof Error ? error.message : "Update failed",
      }
      onUpdate(updatedProject)

      this.scheduleRetry(project.id, () => this.updateProject(updatedProject, updates, onUpdate))
    }
  }

  async deleteProject(project: Project): Promise<void> {
    if (!project.remoteId) return

    logger.sync("Deleting project from database:", {
      projectId: project.id,
      remoteId: project.remoteId,
      projectName: project.name,
    })

    const { error } = await supabase.from("projects").delete().eq("id", project.remoteId)

    if (error) {
      logger.error("Failed to delete project:", {
        projectId: project.id,
        error: error.message,
      })
      throw new Error(error.message)
    }

    logger.sync("Project deleted successfully:", {
      projectId: project.id,
      remoteId: project.remoteId,
    })
  }

  cleanup() {
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.retryTimeouts.clear()
  }
}

export const syncService = new SyncService()
