"use client"

import { useSortable } from "@dnd-kit/sortable"
import { useEffect,useRef } from "react"

import PriorityBadge from "@/components/project/PriorityBadge"
import { TOUCH_DELAYS } from "@/lib/constants"
import { useDragTouchActivation } from "@/lib/hooks/useDragTouchActivation"
import { logger } from "@/lib/logger"
import { type Project } from "@/lib/services/syncService"
import { cn } from "@/lib/utils"

interface ProjectTileProps {
  project: Project
  todoCounts: { total: number; completed: number }
  onSelect: (project: Project) => void
}

export default function ProjectTile({ project, todoCounts, onSelect }: ProjectTileProps) {
  const wasDraggedRef = useRef(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: {
      type: "project",
      project,
    },
  })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  }

  // Reset drag state when dragging ends
  useEffect(() => {
    if (!isDragging && wasDraggedRef.current) {
      // Small delay to let the drag event fully complete before allowing clicks
      setTimeout(() => {
        wasDraggedRef.current = false
      }, 100)
    } else if (isDragging) {
      wasDraggedRef.current = true
    }
  }, [isDragging])

  const remainingTodos = todoCounts.total - todoCounts.completed

  const showTodos = project.status !== "complete"

  const text = () => {
    if (remainingTodos === 0 && todoCounts.total > 0) {
      return "All tasks complete"
    } else if (todoCounts.total === 0) {
      return "No tasks yet"
    } else if (remainingTodos === 1) {
      return "1 task"
    } else {
      return remainingTodos + " tasks"
    }
  }

  const handleNavigation = () => {
    logger.userAction("Selecting project", {
      projectId: project.id,
      projectName: project.name,
      todoCounts,
    })

    // Navigate to project using callback
    onSelect(project)
  }

  const {
    isPressed,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handlePointerDown,
    pointerUpHandlers,
    noSelectStyle,
  } = useDragTouchActivation({
    listeners,
    isDragging,
    delay: TOUCH_DELAYS.PROJECT_LONG_PRESS,
    onTap: handleNavigation,
  })

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if we just finished dragging
    if (wasDraggedRef.current || isDragging) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Navigate to project if it's a valid click
    e.preventDefault()
    handleNavigation()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging || isPressed ? "z-50" : ""}`}
      {...attributes}
    >
      <div
        className={`w-full h-20 p-4 rounded-md border transition-all duration-200 transform hover:scale-105 bg-card select-none cursor-pointer ${
          isDragging || isPressed ? "shadow-lg bg-accent/20" : ""
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onPointerDown={handlePointerDown}
        {...pointerUpHandlers}
        onClick={handleClick}
        onKeyDown={listeners?.onKeyDown as React.KeyboardEventHandler<HTMLDivElement>}
        style={noSelectStyle}
      >
        <div className="h-full flex flex-col justify-between">
          <h3
            className={cn(
              "font-semibold text-lg text-card-foreground leading-tight truncate",
              isDragging ? "select-none" : ""
            )}
          >
            {project.name}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <PriorityBadge priority={project.priority} />
            <p className="text-sm whitespace-nowrap text-card-foreground/50">
              {showTodos ? text() : "\u00A0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
