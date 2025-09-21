"use client"

import { type Todo } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
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
  const { reorderTodos } = useProjectStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = todos.findIndex((todo) => todo.id === active.id)
      const newIndex = todos.findIndex((todo) => todo.id === over?.id)

      const newOrder = arrayMove(todos, oldIndex, newIndex)
      await reorderTodos(projectId, newOrder)
    }
  }

  if (todos.length === 0) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={todos.map((todo) => todo.id)}
        strategy={verticalListSortingStrategy}
      >
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
      </SortableContext>
    </DndContext>
  )
}
