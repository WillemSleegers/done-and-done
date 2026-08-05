"use client"

import { ChevronRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type Project } from "@/lib/services/syncService"
import { cn } from "@/lib/utils"

import ProjectTile from "./ProjectTile"

export type SortColumn = "name" | "priority" | "category" | "status" | "tasks"
export type SortDirection = "asc" | "desc"
export type SortState = { column: SortColumn | null; direction: SortDirection }

export type TableColumn = "priority" | "category" | "status"

export interface ProjectGroup {
  key: string
  title: string | null
  projects: Project[]
}

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

interface ProjectsTableProps {
  groups: ProjectGroup[]
  todoCounts: Record<string, { total: number; completed: number }>
  onSelectProject: (project: Project) => void
  hiddenColumns?: TableColumn[]
  sort: SortState
  onSortChange: (sort: SortState) => void
  collapsedGroups: Set<string>
  onToggleGroupCollapsed: (key: string) => void
}

export default function ProjectsTable({
  groups,
  todoCounts,
  onSelectProject,
  hiddenColumns = [],
  sort,
  onSortChange,
  collapsedGroups,
  onToggleGroupCollapsed,
}: ProjectsTableProps) {
  const visibleGroups = groups.filter((group) => group.projects.length > 0)

  if (visibleGroups.length === 0) {
    return null
  }

  const toggleSort = (column: SortColumn) => {
    onSortChange(
      sort.column === column
        ? { column, direction: sort.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" }
    )
  }

  const sortProjects = (projects: Project[]) => {
    if (!sort.column) return projects

    const remainingTasks = (project: Project) => {
      const counts = todoCounts[project.id] || { total: 0, completed: 0 }
      return counts.total - counts.completed
    }

    return [...projects].sort((a, b) => {
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
  }

  const headClass = (column: SortColumn) =>
    cn("cursor-pointer select-none", sort.column === column && "text-foreground")

  const showColumn = (column: TableColumn) => !hiddenColumns.includes(column)

  const columnCount = 2 + (["priority", "category", "status"] as const).filter(showColumn).length

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={cn(headClass("name"), "pl-7")} onClick={() => toggleSort("name")}>
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
          <TableHead
            className={cn(headClass("tasks"), "text-right")}
            onClick={() => toggleSort("tasks")}
          >
            Tasks
          </TableHead>
        </TableRow>
      </TableHeader>
      {visibleGroups.map((group) => {
        const collapsed = group.title !== null && collapsedGroups.has(group.key)

        return (
          <TableBody key={group.key}>
            {group.title !== null && (
              <TableRow
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onToggleGroupCollapsed(group.key)}
              >
                <TableCell
                  colSpan={columnCount}
                  className="relative pl-7 text-sm font-semibold text-muted-foreground"
                >
                  <ChevronRight
                    size={14}
                    className={cn(
                      "absolute left-2 top-1/2 -translate-y-1/2 transition-transform",
                      !collapsed && "rotate-90"
                    )}
                  />
                  {group.title}
                </TableCell>
              </TableRow>
            )}
            {!collapsed &&
              sortProjects(group.projects).map((project) => (
                <ProjectTile
                  key={project.id}
                  project={project}
                  todoCounts={todoCounts[project.id] || { total: 0, completed: 0 }}
                  onSelect={onSelectProject}
                  hiddenColumns={hiddenColumns}
                />
              ))}
          </TableBody>
        )
      })}
    </Table>
  )
}
