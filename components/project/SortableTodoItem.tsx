"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { type Todo } from "@/lib/services/syncService"
import TodoItem from "./TodoItem"

interface SortableTodoItemProps {
  todo: Todo
  projectId: string
  isEditing: boolean
  onStartEditing: () => void
  onCancelEditing: () => void
  onSaveEdit: (text: string) => Promise<void>
  onOpenDateDialog: () => void
}

export default function SortableTodoItem({
  todo,
  projectId,
  isEditing,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onOpenDateDialog,
}: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? "z-50" : ""}`}
    >
      <TodoItem
        todo={todo}
        projectId={projectId}
        isEditing={isEditing}
        onStartEditing={onStartEditing}
        onCancelEditing={onCancelEditing}
        onSaveEdit={onSaveEdit}
        onOpenDateDialog={onOpenDateDialog}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDraggable={!isEditing}
      />
    </div>
  )
}