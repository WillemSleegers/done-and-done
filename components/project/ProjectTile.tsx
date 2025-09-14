"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type Project } from "@/lib/services/syncService"

interface ProjectTileProps {
  project: Project
  todoCounts: { total: number; completed: number }
}

export default function ProjectTile({ project, todoCounts }: ProjectTileProps) {
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
    const colorClass = project.priority === 'high' ? 'bg-destructive' : 
                      project.priority === 'normal' ? 'bg-primary' : 'bg-muted-foreground'
    
    return <div className={`size-3 rounded-full ${colorClass}`} />
  }

  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex-1 w-fit h-24 p-4 rounded-md border transition-all duration-200 transform hover:scale-105 bg-card"
    >
      <div className="h-full flex flex-col justify-center">
        <h3
          className={cn(
            "font-semibold text-lg truncate flex-1 text-card-foreground"
          )}
        >
          {project.name}
        </h3>

        <div className="flex items-center gap-2">
          {getPriorityDot()}
          <p className="text-sm whitespace-nowrap text-card-foreground/50">
            {showTodos ? text() : "\u00A0"}
          </p>
        </div>
      </div>
    </Link>
  )
}
