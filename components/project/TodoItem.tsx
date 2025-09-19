"use client"

import { useState } from "react"
import { type Todo } from "@/lib/services/syncService"
import { type DraggableAttributes } from "@dnd-kit/core"
import { type SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"
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
  dragAttributes?: DraggableAttributes
  dragListeners?: SyntheticListenerMap | undefined
  isDraggable?: boolean
}

export default function TodoItem({
  todo,
  projectId,
  isEditing,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onOpenDateDialog,
  dragAttributes,
  dragListeners,
  isDraggable = false,
}: TodoItemProps) {
  const { updateTodo, deleteTodo } = useProjectStore()
  const [openDropdown, setOpenDropdown] = useState(false)

  const handleToggleTodo = async () => {
    if (isEditing) return

    try {
      await updateTodo(todo.id, { completed: !todo.completed })
    } catch {
    }
  }

  const handleDeleteTodo = async () => {
    try {
      await deleteTodo(todo.id, projectId)
    } catch {
    }
  }

  const startEditing = () => {
    onStartEditing()
    setOpenDropdown(false)
  }

  const openDateDialog = () => {
    onOpenDateDialog()
    setOpenDropdown(false)
  }

  return (
    <div
      className={`flex items-center gap-3 ps-3 py-1 pe-1 rounded-lg border transition-all bg-card cursor-pointer hover:bg-accent/50`}
      onClick={handleToggleTodo}
      {...(isDraggable && dragAttributes ? dragAttributes : {})}
      {...(isDraggable && dragListeners ? dragListeners : {})}
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
          className={`text-sm outline-none break-words ${
            todo.completed
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
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
          <span className="text-sm text-muted-foreground shrink-0">
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
            disabled={isEditing}
            tabIndex={isEditing ? -1 : 0}
          >
            <MoreHorizontal size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
  )
}
