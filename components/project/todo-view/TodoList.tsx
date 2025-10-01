"use client"

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DRAG_CONSTRAINTS, TOUCH_DELAYS } from "@/lib/constants"
import { type Todo } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"

import TodoItem from "../TodoItem"

interface TodoListProps {
  todos: Todo[]
  projectId: string
  onOpenDateDialog: (todoId: string) => void
}

export default function TodoList({ todos, projectId, onOpenDateDialog }: TodoListProps) {
  const { reorderTodos } = useProjectStore()
  const [showAllCompleted, setShowAllCompleted] = useState(false)

  // Split todos into open and completed
  const openTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)

  // Show only first 3 completed todos unless expanded
  const visibleCompletedTodos = showAllCompleted ? completedTodos : completedTodos.slice(0, 3)
  const hiddenCompletedCount = completedTodos.length - visibleCompletedTodos.length

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: DRAG_CONSTRAINTS.POINTER_DISTANCE,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_DELAYS.TODO_DRAG_ACTIVATION,
        tolerance: DRAG_CONSTRAINTS.TOUCH_TOLERANCE,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      // Only allow reordering within the open todos section
      const activeTodo = openTodos.find((todo) => todo.id === active.id)
      const overTodo = openTodos.find((todo) => todo.id === over?.id)

      if (activeTodo && overTodo) {
        const oldIndex = openTodos.findIndex((todo) => todo.id === active.id)
        const newIndex = openTodos.findIndex((todo) => todo.id === over?.id)

        const reorderedOpenTodos = arrayMove(openTodos, oldIndex, newIndex)
        // Combine with completed todos to maintain full list
        const newOrder = [...reorderedOpenTodos, ...completedTodos]
        await reorderTodos(projectId, newOrder)
      }
    }
  }

  if (todos.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Open todos section with drag and drop */}
      {openTodos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={openTodos.map((todo) => todo.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {openTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  projectId={projectId}
                  onOpenDateDialog={() => onOpenDateDialog(todo.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Completed todos section */}
      {completedTodos.length > 0 && (
        <div className="space-y-4">
          {/* Visual separator */}
          {openTodos.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-sm text-muted-foreground font-medium">
                Completed ({completedTodos.length})
              </span>
              <div className="flex-1 h-px bg-border"></div>
            </div>
          )}

          {/* Completed todos list */}
          <div className="space-y-4">
            {visibleCompletedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                projectId={projectId}
                onOpenDateDialog={() => onOpenDateDialog(todo.id)}
              />
            ))}
          </div>

          {/* Show more/less toggle */}
          {completedTodos.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllCompleted(!showAllCompleted)}
              className="w-full h-10 text-muted-foreground hover:text-foreground"
            >
              {showAllCompleted ? (
                <>Show less completed</>
              ) : (
                <>Show {hiddenCompletedCount} more completed</>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
