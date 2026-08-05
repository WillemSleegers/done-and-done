import { type Project, type Todo } from "@/lib/services/syncService"

export interface ProjectState {
  projects: Project[]
  todos: Record<string, Todo[]>
  todoCounts: Record<string, { total: number; completed: number }>
  isLoading: boolean
}

export interface ProjectActions {
  fetchInitialData: () => Promise<void>
  refreshData: () => Promise<void>

  addProject: (
    data: Omit<Project, "created_at" | "syncState" | "remoteId"> & { id?: string }
  ) => Promise<Project>
  updateProject: (
    projectId: string,
    updates: Partial<Pick<Project, "name" | "notes" | "status" | "priority" | "category">>
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

export type ProjectStore = ProjectState & ProjectActions
