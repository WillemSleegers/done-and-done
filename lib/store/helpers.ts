import { type Project, type Todo } from "@/lib/services/syncService"

import { type ProjectState } from "./types"

export const generateId = () => crypto.randomUUID()

export const updateTodoCounts = (todos: Record<string, Todo[]>) => {
  const counts: Record<string, { total: number; completed: number }> = {}
  Object.entries(todos).forEach(([projectId, projectTodos]) => {
    const total = projectTodos.length
    const completed = projectTodos.filter((todo) => todo.completed).length
    counts[projectId] = { total, completed }
  })
  return counts
}

export const applyProjectUpdate = (state: ProjectState, updatedProject: Project) => ({
  projects: state.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
})

export const withRecomputedCounts = (
  state: ProjectState,
  projectId: string,
  projectTodos: Todo[]
) => {
  const todos = { ...state.todos, [projectId]: projectTodos }
  return { todos, todoCounts: updateTodoCounts(todos) }
}

export const applyTodoUpdate = (state: ProjectState, projectId: string, updatedTodo: Todo) => {
  const projectTodos = (state.todos[projectId] || []).map((t) =>
    t.id === updatedTodo.id ? updatedTodo : t
  )
  return {
    todos: { ...state.todos, [projectId]: projectTodos },
    todoCounts: {
      ...state.todoCounts,
      [projectId]: {
        total: projectTodos.length,
        completed: projectTodos.filter((t) => t.completed).length,
      },
    },
  }
}

export const mergeWithLocalItems = (
  serverProjects: Project[],
  serverTodos: Record<string, Todo[]>,
  currentProjects: Project[],
  currentTodos: Record<string, Todo[]>
) => {
  // Preserve any local/syncing/failed items that haven't been saved to the server yet
  const localProjects = currentProjects.filter(
    (p) => p.syncState === "local" || p.syncState === "syncing" || p.syncState === "failed"
  )
  const mergedProjects = [
    ...serverProjects,
    ...localProjects.filter((lp) => !serverProjects.some((p) => p.id === lp.id)),
  ]

  const mergedTodos = { ...serverTodos }
  Object.entries(currentTodos).forEach(([projectId, projectTodos]) => {
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

  return { mergedProjects, mergedTodos }
}
