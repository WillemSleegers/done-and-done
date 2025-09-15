"use client"

import { useState, useRef } from "react"
import { type Project } from "@/lib/services/syncService"
import { type ProjectStatus, type ProjectPriority } from "@/lib/supabase"
import { MoreHorizontal, Trash } from "lucide-react"
import { useProjectStore } from "@/lib/store/projectStore"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectHeaderProps {
  project: Project
  isNewProject?: boolean
  nameValue: string
  notesValue: string
  onNameChange: (value: string) => void
  onNameSave: () => Promise<void>
  onNameKeyDown: (e: React.KeyboardEvent) => void
  onDeleteProject: () => void
}

export default function ProjectHeader({
  project,
  isNewProject = false,
  nameValue,
  notesValue,
  onNameChange,
  onNameSave,
  onNameKeyDown,
  onDeleteProject,
}: ProjectHeaderProps) {
  const { updateProject } = useProjectStore()
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleStatusChange = (newStatus: ProjectStatus) => {
    updateProject(project.id, { status: newStatus })
  }

  const handlePriorityChange = async (priority: ProjectPriority) => {
    try {
      await updateProject(project.id, { priority })
    } catch {
      // Priority update will retry in background
    }
  }

  return (
    <div className="space-y-4">
      {/* Priority, Status, and Actions buttons - left aligned */}
      <div className="flex flex-wrap gap-2">
        {/* Priority dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 h-10 shadow-none"
              disabled={isNewProject}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  project.priority === "high"
                    ? "bg-destructive"
                    : project.priority === "normal"
                    ? "bg-primary"
                    : "bg-muted-foreground"
                }`}
              />
              {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => handlePriorityChange("high")}
              className={project.priority === "high" ? "bg-muted" : ""}
            >
              <div className="w-3 h-3 bg-destructive rounded-full mr-2" />
              High Priority
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handlePriorityChange("normal")}
              className={project.priority === "normal" ? "bg-muted" : ""}
            >
              <div className="w-3 h-3 bg-primary rounded-full mr-2" />
              Normal Priority
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handlePriorityChange("low")}
              className={project.priority === "low" ? "bg-muted" : ""}
            >
              <div className="w-3 h-3 bg-muted-foreground rounded-full mr-2" />
              Low Priority
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 shadow-none"
              disabled={isNewProject}
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => handleStatusChange("active")}
              className={project.status === "active" ? "bg-muted" : ""}
            >
              Active
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("inactive")}
              className={project.status === "inactive" ? "bg-muted" : ""}
            >
              Inactive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("complete")}
              className={project.status === "complete" ? "bg-muted" : ""}
            >
              Complete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Actions dropdown */}
        {!isNewProject && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-10 shadow-none"
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={onDeleteProject}
                className="text-destructive focus:text-destructive"
              >
                <Trash size={16} className="mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Project title */}
      <div>
        <input
          ref={nameInputRef}
          type="text"
          value={nameValue}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onNameSave}
          onKeyDown={onNameKeyDown}
          className="text-2xl sm:text-3xl font-bold text-foreground bg-transparent border-none outline-none focus:outline-none w-full p-0 m-0 cursor-pointer hover:text-primary transition-colors break-words"
          placeholder="Project name"
        />
      </div>
    </div>
  )
}