"use client"

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type Project } from "@/lib/services/syncService"
import { cn } from "@/lib/utils"

import ProjectTile from "./ProjectTile"

export type SortColumn = "name" | "priority" | "category" | "status" | "tasks"
export type SortDirection = "asc" | "desc"
export type SortState = { column: SortColumn | null; direction: SortDirection }

export type TableColumn = "priority" | "category" | "status"

const PRIORITY_ORDER: Record<Project["priority"], number> = {
  high: 1,
  normal: 2,
  low: 3,
}

const STATUS_ORDER: Record<Project["status"], number> = {
  active: 1,
  inactive: 2,
  complete: 3,
}

interface ProjectTableSectionProps {
  projects: Project[]
  todoCounts: Record<string, { total: number; completed: number }>
  onSelectProject: (project: Project) => void
  hiddenColumns?: TableColumn[]
  sort: SortState
  onSortChange: (sort: SortState) => void
}

export default function ProjectTableSection({
  projects,
  todoCounts,
  onSelectProject,
  hiddenColumns = [],
  sort,
  onSortChange,
}: ProjectTableSectionProps) {
  if (projects.length === 0) {
    return null
  }

  const remainingTasks = (project: Project) => {
    const counts = todoCounts[project.id] || { total: 0, completed: 0 }
    return counts.total - counts.completed
  }

  const toggleSort = (column: SortColumn) => {
    onSortChange(
      sort.column === column
        ? { column, direction: sort.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" }
    )
  }

  const sortedProjects = sort.column
    ? [...projects].sort((a, b) => {
        let cmp = 0
        if (sort.column === "name") {
          cmp = a.name.localeCompare(b.name)
        } else if (sort.column === "priority") {
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        } else if (sort.column === "category") {
          cmp = (a.category || "").localeCompare(b.category || "")
        } else if (sort.column === "status") {
          cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        } else if (sort.column === "tasks") {
          cmp = remainingTasks(a) - remainingTasks(b)
        }
        return sort.direction === "asc" ? cmp : -cmp
      })
    : projects

  const headClass = (column: SortColumn) =>
    cn("cursor-pointer select-none", sort.column === column && "text-foreground")

  const showColumn = (column: TableColumn) => !hiddenColumns.includes(column)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={headClass("name")} onClick={() => toggleSort("name")}>
            Name
          </TableHead>
          {showColumn("priority") && (
            <TableHead className={headClass("priority")} onClick={() => toggleSort("priority")}>
              Priority
            </TableHead>
          )}
          {showColumn("category") && (
            <TableHead className={headClass("category")} onClick={() => toggleSort("category")}>
              Category
            </TableHead>
          )}
          {showColumn("status") && (
            <TableHead className={headClass("status")} onClick={() => toggleSort("status")}>
              Status
            </TableHead>
          )}
          <TableHead className={cn(headClass("tasks"), "text-right")} onClick={() => toggleSort("tasks")}>
            Tasks
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedProjects.map((project) => {
          const counts = todoCounts[project.id] || { total: 0, completed: 0 }
          return (
            <ProjectTile
              key={project.id}
              project={project}
              todoCounts={counts}
              onSelect={onSelectProject}
              hiddenColumns={hiddenColumns}
            />
          )
        })}
      </TableBody>
    </Table>
  )
}
