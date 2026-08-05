"use client"

import PriorityBadge from "@/components/project/PriorityBadge"
import { type TableColumn } from "@/components/project/ProjectsTable"
import { TableCell, TableRow } from "@/components/ui/table"
import { logger } from "@/lib/logger"
import { type Project } from "@/lib/services/syncService"

interface ProjectTileProps {
  project: Project
  todoCounts: { total: number; completed: number }
  onSelect: (project: Project) => void
  hiddenColumns?: TableColumn[]
}

export default function ProjectTile({
  project,
  todoCounts,
  onSelect,
  hiddenColumns = [],
}: ProjectTileProps) {
  const remainingTodos = todoCounts.total - todoCounts.completed

  const handleNavigation = () => {
    logger.userAction("Selecting project", {
      projectId: project.id,
      projectName: project.name,
      todoCounts,
    })

    onSelect(project)
  }

  const showColumn = (column: TableColumn) => !hiddenColumns.includes(column)

  return (
    <TableRow className="cursor-pointer" onClick={handleNavigation}>
      <TableCell className="font-medium text-card-foreground truncate max-w-0 w-full min-w-40">
        {project.name}
      </TableCell>
      {showColumn("priority") && (
        <TableCell>
          <PriorityBadge priority={project.priority} />
        </TableCell>
      )}
      {showColumn("category") && (
        <TableCell className="text-muted-foreground truncate max-w-32">
          {project.category || "—"}
        </TableCell>
      )}
      {showColumn("status") && (
        <TableCell className="text-muted-foreground truncate max-w-32">
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </TableCell>
      )}
      <TableCell className="text-right text-muted-foreground whitespace-nowrap">
        {remainingTodos}
      </TableCell>
    </TableRow>
  )
}
