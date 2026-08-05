import { type StateCreator } from "zustand"

import { logger } from "@/lib/logger"
import { syncService,type Todo } from "@/lib/services/syncService"
import { syncActivityTracker } from "@/lib/syncActivityTracker"

import { applyTodoUpdate, generateId, withRecomputedCounts } from "./helpers"
import { type ProjectActions, type ProjectStore } from "./types"

type TodoSliceActions = Pick<
  ProjectActions,
  | "addTodo"
  | "updateTodo"
  | "deleteTodo"
  | "retryFailedTodo"
  | "reorderTodos"
  | "getProjectTodos"
>

export const createTodoSlice: StateCreator<ProjectStore, [], [], TodoSliceActions> = (
  set,
  get
) => ({
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

    set((state) =>
      withRecomputedCounts(state, projectId, [newTodo, ...(state.todos[projectId] || [])])
    )

    const project = get().projects.find((p) => p.id === projectId)

    // Track activity
    syncActivityTracker.addActivity({
      id: newTodo.id,
      name: text,
      type: "todo",
      action: "added",
      projectName: project?.name,
    })
    syncService.syncTodo(newTodo, project?.remoteId, (patch) => {
      set((state) => applyTodoUpdate(state, projectId, patch))

      if (patch.syncState === "synced") {
        const current = get().todos[projectId]?.find((t) => t.id === newTodo.id)
        if (current) {
          const drift: Partial<Pick<Todo, "text" | "completed" | "due_date" | "order">> = {}
          if (current.text !== newTodo.text) drift.text = current.text
          if (current.completed !== newTodo.completed) drift.completed = current.completed
          if (current.due_date !== newTodo.due_date) drift.due_date = current.due_date
          if (current.order !== newTodo.order) drift.order = current.order

          if (Object.keys(drift).length > 0) {
            syncService.updateTodo(current, drift, (t) =>
              set((state) => applyTodoUpdate(state, projectId, t))
            )
          }
        }
      }
    })

    return newTodo
  },

  updateTodo: async (todoId, updates) => {
    const { todos } = get()
    const projectId = Object.keys(todos).find((pid) => todos[pid]?.some((t) => t.id === todoId))
    if (!projectId) return

    const todo = todos[projectId]?.find((t) => t.id === todoId)
    if (!todo) return

    set((state) =>
      withRecomputedCounts(
        state,
        projectId,
        state.todos[projectId]?.map((t) => (t.id === todoId ? { ...t, ...updates } : t)) || []
      )
    )

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
      syncService.updateTodo({ ...todo, ...updates }, updates, (patch) => {
        set((state) => applyTodoUpdate(state, projectId, patch))
      })
    }
  },

  deleteTodo: async (todoId, projectId) => {
    const todo = get().todos[projectId]?.find((t) => t.id === todoId)
    if (!todo) return

    set((state) =>
      withRecomputedCounts(
        state,
        projectId,
        state.todos[projectId]?.filter((t) => t.id !== todoId) || []
      )
    )

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
      const lastError = error instanceof Error ? error.message : "Delete failed"
      set((state) =>
        withRecomputedCounts(
          state,
          projectId,
          [
            ...(state.todos[projectId] || []),
            { ...todo, syncState: "failed" as const, lastError, pendingOperation: "delete" as const },
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        )
      )
      throw error
    }
  },

  retryFailedTodo: async (todoId, projectId) => {
    const { todos, projects } = get()
    const todo = todos[projectId]?.find((t) => t.id === todoId)
    if (!todo || todo.syncState !== "failed") return

    if (todo.pendingOperation === "delete") {
      await get().deleteTodo(todoId, projectId)
      return
    }

    const project = projects.find((p) => p.id === projectId)

    if (todo.remoteId) {
      syncService.updateTodo(
        todo,
        { text: todo.text, completed: todo.completed, due_date: todo.due_date, order: todo.order },
        (patch) => {
          set((state) => applyTodoUpdate(state, projectId, patch))
        }
      )
    } else {
      syncService.syncTodo(todo, project?.remoteId, (patch) => {
        set((state) => applyTodoUpdate(state, projectId, patch))
      })
    }
  },

  reorderTodos: async (projectId, newOrder) => {
    const previousTodos = get().todos[projectId] || []

    // Update order values based on new position
    const reorderedTodos = newOrder.map((todo, index) => ({
      ...todo,
      order: index + 1,
    }))

    // Update local state immediately for optimistic UI
    set((state) => ({
      todos: {
        ...state.todos,
        [projectId]: reorderedTodos,
      },
    }))

    // Only push the items whose order actually changed
    const changedTodos = reorderedTodos.filter((todo) => {
      const previous = previousTodos.find((t) => t.id === todo.id)
      return previous && previous.order !== todo.order
    })

    if (changedTodos.length === 0) return

    // Sync to server
    try {
      await syncService.updateTodosOrder(changedTodos)
    } catch (error) {
      logger.error("Failed to sync todo order:", error)
      set((state) => ({
        todos: {
          ...state.todos,
          [projectId]: (state.todos[projectId] || []).map((t) =>
            t.remoteId && changedTodos.some((ct) => ct.id === t.id)
              ? { ...t, syncState: "failed" as const, lastError: "Failed to save order" }
              : t
          ),
        },
      }))
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
})
