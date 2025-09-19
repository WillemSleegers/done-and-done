"use client"

import { type Todo } from "@/lib/services/syncService"
import TodoItem from "../TodoItem"

interface TodoListProps {
  todos: Todo[]
  projectId: string
  editingTodoId: string | null
  onStartEditing: (todoId: string) => void
  onCancelEditing: () => void
  onSaveEdit: (text: string) => Promise<void>
  onOpenDateDialog: (todoId: string) => void
}

export default function TodoList({
  todos,
  projectId,
  editingTodoId,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onOpenDateDialog,
}: TodoListProps) {
  if (todos.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          projectId={projectId}
          isEditing={editingTodoId === todo.id}
          onStartEditing={() => onStartEditing(todo.id)}
          onCancelEditing={onCancelEditing}
          onSaveEdit={onSaveEdit}
          onOpenDateDialog={() => onOpenDateDialog(todo.id)}
        />
      ))}
    </div>
  )
}