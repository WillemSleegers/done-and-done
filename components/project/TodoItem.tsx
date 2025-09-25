"use client"

import { useState, useRef, useEffect } from "react"
import { type Todo } from "@/lib/services/syncService"
import { useSortable } from "@dnd-kit/sortable"

import {
  Check,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Edit,
  Trash,
} from "lucide-react"
import { useProjectStore } from "@/lib/store/projectStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

interface TodoItemProps {
  todo: Todo
  projectId: string
  onOpenDateDialog: () => void
}

export default function TodoItem({
  todo,
  projectId,
  onOpenDateDialog,
}: TodoItemProps) {
  const { updateTodo, deleteTodo } = useProjectStore()
  const [openDropdown, setOpenDropdown] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const editInputRef = useRef<HTMLInputElement>(null)
  const originalEditTextRef = useRef(todo.text)

  // Touch handling refs
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartEventRef = useRef<React.TouchEvent | null>(null)
  const wasTouchInteractionRef = useRef(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    data: {
      type: "todo",
      todo,
    },
  })

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current)
      }
    }
  }, [])

  const handleToggleTodo = async () => {
    if (isEditing) return

    try {
      const isCompletingTodo = !todo.completed
      await updateTodo(todo.id, {
        completed: isCompletingTodo,
        completed_at: isCompletingTodo ? new Date().toISOString() : null,
      })
    } catch {}
  }

  const startEditing = () => {
    setIsEditing(true)
    setEditText(todo.text)
    originalEditTextRef.current = todo.text // Store original value when editing starts
    setOpenDropdown(false)
    // Focus the input after state update
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditText(originalEditTextRef.current) // Reset to original value when editing started
  }

  const saveEditing = async () => {
    if (!editText.trim()) {
      cancelEditing()
      return
    }

    try {
      await updateTodo(todo.id, { text: editText.trim() })
      setIsEditing(false)
    } catch {
      // Keep editing state on error
    }
  }

  const handleDeleteTodo = async () => {
    try {
      await deleteTodo(todo.id, projectId)
    } catch {}
  }

  // Touch handling with delay for drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing) return

    wasTouchInteractionRef.current = true
    e.preventDefault()

    touchStartEventRef.current = e

    touchTimeoutRef.current = setTimeout(() => {
      if (listeners?.onTouchStart && touchStartEventRef.current) {
        listeners.onTouchStart(
          touchStartEventRef.current as React.TouchEvent<Element>
        )
      }
    }, 150) // Slightly shorter delay for todos
  }

  const handleTouchEnd = () => {
    if (isEditing) return

    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
      if (!isDragging) {
        handleToggleTodo()
      }
    }
    touchStartEventRef.current = null

    setTimeout(() => {
      wasTouchInteractionRef.current = false
    }, 100)
  }

  const handleTouchMove = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
      if (listeners?.onTouchStart && touchStartEventRef.current) {
        listeners.onTouchStart(
          touchStartEventRef.current as React.TouchEvent<Element>
        )
      }
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return

    if (e.pointerType === "touch") {
      e.preventDefault()
    } else if (e.pointerType === "mouse") {
      setIsPressed(true)
      if (listeners?.onPointerDown) {
        listeners.onPointerDown(e as React.PointerEvent<Element>)
      }
    }
  }

  const handleClick = () => {
    if (isEditing || wasTouchInteractionRef.current) return
    handleToggleTodo()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging || isPressed ? "z-50" : ""}`}
      {...(!isEditing ? attributes : {})}
    >
      <div
        className={`flex items-center gap-3 ps-3 py-1 pe-1 min-h-[40px] rounded-lg transition-all bg-card cursor-pointer hover:bg-accent/50 select-none ${
          isDragging || isPressed ? "shadow-lg bg-accent/20" : ""
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onPointerDown={handlePointerDown}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        onPointerCancel={() => setIsPressed(false)}
        onClick={handleClick}
        onKeyDown={
          isEditing
            ? undefined
            : (listeners?.onKeyDown as React.KeyboardEventHandler<HTMLDivElement>)
        }
        style={{
          WebkitTapHighlightColor: "transparent",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none" as const,
          userSelect: "none",
        }}
      >
        {/* Checkbox */}
        <div
          className={`flex-shrink-0 size-4 rounded-full border-1 transition-all flex items-center justify-center ${
            todo.completed
              ? "border-success text-success-foreground"
              : "border-border hover:border-success"
          }`}
        >
          {todo.completed && <Check size={14} />}
        </div>

        {/* Todo text content */}
        <div className="flex-1 min-w-0 flex flex-wrap justify-between items-baseline gap-1">
          {isEditing ? (
            <>
              {/* Invisible Input that looks identical to the span */}
              <Input
                ref={editInputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    saveEditing()
                  } else if (e.key === "Escape") {
                    e.preventDefault()
                    cancelEditing()
                  }
                }}
                onBlur={saveEditing}
                className={`
                  flex-1 text-base
                  border-0 shadow-none rounded-none
                  focus-visible:border-transparent focus-visible:ring-0
                  px-0 py-0 h-auto min-h-0 w-auto
                  dark:bg-transparent
                  ${
                    todo.completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                // Layout: flex-1 text-base - Match span layout and font size
                // Override dark mode bg: dark:bg-transparent - Override shadcn's dark:bg-input/30
                // Remove borders/shadows: border-0 shadow-none rounded-none - Override shadcn's border/rounded-md/shadow-xs
                // Remove focus styles: focus-visible:border-transparent focus-visible:ring-0 - Override shadcn's focus-visible classes
                // Reset spacing: px-0 py-0 h-auto min-h-0 w-auto - Override shadcn's px-3 py-1 h-9 w-full
                autoFocus
              />
              {/* Due date - keep in same position during edit */}
              {todo.due_date && (
                <span className="text-base text-muted-foreground shrink-0">
                  Due {format(new Date(todo.due_date), "MMM d, yyyy")}
                </span>
              )}
            </>
          ) : (
            <>
              <span
                className={`text-base break-words ${
                  todo.completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                } ${isDragging ? "select-none" : ""}`}
              >
                {todo.text}
              </span>
              {/* Due date */}
              {todo.due_date && (
                <span className="text-base text-muted-foreground shrink-0">
                  Due {format(new Date(todo.due_date), "MMM d, yyyy")}
                </span>
              )}
            </>
          )}
        </div>

        {/* Actions dropdown */}
        <DropdownMenu
          open={openDropdown && !isEditing}
          onOpenChange={(open) => {
            if (!isEditing) {
              setOpenDropdown(open)
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex-shrink-0 size-[26px]"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={isEditing}
              tabIndex={isEditing ? -1 : 0}
            >
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onOpenDateDialog()
              }}
            >
              <CalendarIcon size={16} className="mr-2" />
              Set due date
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                startEditing()
              }}
            >
              <Edit size={16} className="mr-2" />
              Edit todo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteTodo()
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash size={16} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
