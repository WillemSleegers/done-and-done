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
  isEditing: boolean
  onStartEditing: () => void
  onCancelEditing: () => void
  onSaveEdit: (text: string) => Promise<void>
  onOpenDateDialog: () => void
}

export default function TodoItem({
  todo,
  projectId,
  isEditing,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onOpenDateDialog,
}: TodoItemProps) {
  const { updateTodo, deleteTodo } = useProjectStore()
  const [openDropdown, setOpenDropdown] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

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
      await updateTodo(todo.id, { completed: !todo.completed })
    } catch {}
  }

  const handleDeleteTodo = async () => {
    try {
      await deleteTodo(todo.id, projectId)
    } catch {}
  }

  const startEditing = () => {
    onStartEditing()
    setOpenDropdown(false)
  }

  const openDateDialog = () => {
    onOpenDateDialog()
    setOpenDropdown(false)
  }

  // Touch handling with delay for drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing) return

    wasTouchInteractionRef.current = true
    e.preventDefault()

    touchStartEventRef.current = e

    touchTimeoutRef.current = setTimeout(() => {
      if (listeners?.onTouchStart && touchStartEventRef.current) {
        listeners.onTouchStart(touchStartEventRef.current as React.TouchEvent<Element>)
      }
    }, 150) // Slightly shorter delay for todos
  }

  const handleTouchEnd = (_e: React.TouchEvent) => {
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

  const handleTouchMove = (_e: React.TouchEvent) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
      if (listeners?.onTouchStart && touchStartEventRef.current) {
        listeners.onTouchStart(touchStartEventRef.current as React.TouchEvent<Element>)
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

  const handleClick = (_e: React.MouseEvent) => {
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
        onKeyDown={listeners?.onKeyDown as React.KeyboardEventHandler<HTMLDivElement>}
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
          <span
            className={`text-base outline-none break-words ${
              todo.completed
                ? "line-through text-muted-foreground"
                : "text-foreground"
            } ${isDragging ? "select-none" : ""} ${!isEditing ? "pointer-events-none" : ""}`}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onKeyDown={(e) => {
              if (isEditing) {
                if (e.key === "Enter") {
                  e.preventDefault()
                  onSaveEdit(e.currentTarget.textContent || "")
                } else if (e.key === "Escape") {
                  e.preventDefault()
                  onCancelEditing()
                  e.currentTarget.textContent = todo.text
                }
              }
            }}
            onBlur={(e) => {
              if (isEditing) {
                onSaveEdit(e.currentTarget.textContent || "")
              }
            }}
            ref={(el) => {
              if (isEditing && el) {
                // Use setTimeout to ensure DOM is updated
                setTimeout(() => {
                  el.focus()
                  const range = document.createRange()
                  const selection = window.getSelection()
                  range.selectNodeContents(el)
                  range.collapse(false)
                  selection?.removeAllRanges()
                  selection?.addRange(range)
                }, 0)
              }
            }}
          >
            {todo.text}
          </span>

          {/* Due date */}
          {todo.due_date && (
            <span className="text-base text-muted-foreground shrink-0 pointer-events-none">
              Due {format(new Date(todo.due_date), "MMM d, yyyy")}
            </span>
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
                openDateDialog()
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
