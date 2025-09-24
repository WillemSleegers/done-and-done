"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { type Project } from "@/lib/services/syncService"
import { useSortable } from "@dnd-kit/sortable"

interface ProjectTileProps {
  project: Project
  todoCounts: { total: number; completed: number }
}

export default function ProjectTile({ project, todoCounts }: ProjectTileProps) {
  const router = useRouter()
  const [isPressed, setIsPressed] = useState(false)

  // Touch handling refs
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartEventRef = useRef<React.TouchEvent | null>(null)
  const wasTouchInteractionRef = useRef(false)
  const wasDraggedRef = useRef(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.id,
    data: {
      type: "project",
      project,
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

  const getPriorityDot = () => {
    const colorClass =
      project.priority === "high"
        ? "bg-destructive"
        : project.priority === "normal"
        ? "bg-primary"
        : "bg-muted-foreground"

    return <div className={`size-3 rounded-full ${colorClass}`} />
  }

  // Touch handling with delay for drag - similar to TodoItem
  const handleTouchStart = (e: React.TouchEvent) => {
    wasTouchInteractionRef.current = true
    e.preventDefault()

    touchStartEventRef.current = e

    touchTimeoutRef.current = setTimeout(() => {
      if (listeners?.onTouchStart && touchStartEventRef.current) {
        listeners.onTouchStart(
          touchStartEventRef.current as React.TouchEvent<Element>
        )
      }
    }, 200) // Slightly longer delay for projects
  }

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
      // If timeout was still active, it means drag didn't start, so it's a tap
      if (!isDragging) {
        handleNavigation()
      }
    }
    touchStartEventRef.current = null

    setTimeout(() => {
      wasTouchInteractionRef.current = false
    }, 100)
  }

  const handleNavigation = () => {
    // Navigate to project using UUID for stable URLs
    router.push(`/?project=${project.id}`)
  }

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
    if (e.pointerType === "touch") {
      e.preventDefault()
    } else if (e.pointerType === "mouse") {
      setIsPressed(true)
      if (listeners?.onPointerDown) {
        listeners.onPointerDown(e as React.PointerEvent<Element>)
      }
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging || isPressed ? "z-50" : ""}`}
      {...attributes}
    >
      <div
        className={`w-full h-22 p-4 rounded-md border transition-all duration-200 transform hover:scale-105 bg-card select-none cursor-pointer ${
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
          listeners?.onKeyDown as React.KeyboardEventHandler<HTMLDivElement>
        }
        style={{
          WebkitTapHighlightColor: "transparent",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none" as const,
          userSelect: "none",
        }}
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
            {getPriorityDot()}
            <p className="text-sm whitespace-nowrap text-card-foreground/50">
              {showTodos ? text() : "\u00A0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
