"use client"

import { useState } from "react"

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type Project } from "@/lib/services/syncService"
import { cn } from "@/lib/utils"

import ProjectTile from "./ProjectTile"

type SortColumn = "name" | "priority" | "category" | "tasks"
type SortDirection = "asc" | "desc"

const PRIORITY_ORDER: Record<Project["priority"], number> = {
  high: 1,
  normal: 2,
  low: 3,
}

interface ProjectTableSectionProps {
  projects: Project[]
  todoCounts: Record<string, { total: number; completed: number }>
  onSelectProject: (project: Project) => void
}

export default function ProjectTableSection({
  projects,
  todoCounts,
  onSelectProject,
}: ProjectTableSectionProps) {
  const [sort, setSort] = useState<{ column: SortColumn | null; direction: SortDirection }>({
    column: null,
    direction: "asc",
  })

  if (projects.length === 0) {
    return null
  }

  const remainingTasks = (project: Project) => {
    const counts = todoCounts[project.id] || { total: 0, completed: 0 }
    return counts.total - counts.completed
  }

  const toggleSort = (column: SortColumn) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
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
        } else if (sort.column === "tasks") {
          cmp = remainingTasks(a) - remainingTasks(b)
        }
        return sort.direction === "asc" ? cmp : -cmp
      })
    : projects

  const headClass = (column: SortColumn) =>
    cn("cursor-pointer select-none", sort.column === column && "text-foreground")

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={headClass("name")} onClick={() => toggleSort("name")}>
            Name
          </TableHead>
          <TableHead className={headClass("priority")} onClick={() => toggleSort("priority")}>
            Priority
          </TableHead>
          <TableHead className={headClass("category")} onClick={() => toggleSort("category")}>
            Category
          </TableHead>
          <TableHead className={cn(headClass("tasks"), "text-right")} onClick={() => toggleSort("tasks")}>
            Tasks
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedProjects.map((project) => {
          const counts = todoCounts[project.id] || { total: 0, completed: 0 }
          return (
            <ProjectTile key={project.id} project={project} todoCounts={counts} onSelect={onSelectProject} />
          )
        })}
      </TableBody>
    </Table>
  )
}
