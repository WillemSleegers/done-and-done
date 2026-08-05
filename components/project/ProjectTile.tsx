"use client"

import PriorityBadge from "@/components/project/PriorityBadge"
import { TableCell, TableRow } from "@/components/ui/table"
import { logger } from "@/lib/logger"
import { type Project } from "@/lib/services/syncService"

interface ProjectTileProps {
  project: Project
  todoCounts: { total: number; completed: number }
  onSelect: (project: Project) => void
}

export default function ProjectTile({ project, todoCounts, onSelect }: ProjectTileProps) {
  const remainingTodos = todoCounts.total - todoCounts.completed

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

    onSelect(project)
  }

  return (
    <TableRow className="cursor-pointer" onClick={handleNavigation}>
      <TableCell className="font-medium text-card-foreground truncate max-w-0 w-full">
        {project.name}
      </TableCell>
      <TableCell>
        <PriorityBadge priority={project.priority} />
      </TableCell>
      <TableCell className="text-muted-foreground truncate max-w-32">
        {project.category || "—"}
      </TableCell>
      <TableCell className="text-right text-muted-foreground whitespace-nowrap">
        {text()}
      </TableCell>
    </TableRow>
  )
}
