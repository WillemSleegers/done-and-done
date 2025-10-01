"use client"

import { MoreHorizontal, Trash } from "lucide-react"
import { useRef } from "react"

import PriorityBadge from "@/components/project/PriorityBadge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { INPUT_LIMITS } from "@/lib/constants"
import { logger } from "@/lib/logger"
import { type Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"
import { type ProjectPriority,type ProjectStatus } from "@/lib/supabase"

interface ProjectHeaderProps {
  project: Project
  isNewProject?: boolean
  nameValue: string
  onNameChange: (value: string) => void
  onNameSave: () => Promise<void>
  onNameKeyDown: (e: React.KeyboardEvent) => void
  onNameFocus: () => void
  onDeleteProject: () => void
}

export default function ProjectHeader({
  project,
  isNewProject = false,
  nameValue,
  onNameChange,
  onNameSave,
  onNameKeyDown,
  onNameFocus,
  onDeleteProject,
}: ProjectHeaderProps) {
  const { updateProject } = useProjectStore()
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleStatusChange = (newStatus: ProjectStatus) => {
    logger.userAction("Changing project status", {
      projectId: project.id,
      projectName: project.name,
      oldStatus: project.status,
      newStatus,
    })

    updateProject(project.id, { status: newStatus })
  }

  const handlePriorityChange = async (priority: ProjectPriority) => {
    logger.userAction("Changing project priority", {
      projectId: project.id,
      projectName: project.name,
      oldPriority: project.priority,
      newPriority: priority,
    })

    try {
      await updateProject(project.id, { priority })
      logger.userAction("Project priority changed successfully")
    } catch (error) {
      logger.error("Failed to change project priority", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Priority, Status, and Actions buttons - left aligned */}
      <div className="flex flex-wrap gap-4">
        {/* Priority dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-10 shadow-none" disabled={isNewProject}>
              <PriorityBadge priority={project.priority} />
              {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => handlePriorityChange("high")}
              className={project.priority === "high" ? "bg-muted" : ""}
            >
              <PriorityBadge priority="high" />
              <span className="ml-2">High Priority</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handlePriorityChange("normal")}
              className={project.priority === "normal" ? "bg-muted" : ""}
            >
              <PriorityBadge priority="normal" />
              <span className="ml-2">Normal Priority</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handlePriorityChange("low")}
              className={project.priority === "low" ? "bg-muted" : ""}
            >
              <PriorityBadge priority="low" />
              <span className="ml-2">Low Priority</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 shadow-none" disabled={isNewProject}>
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
              <Button variant="outline" className="size-10 shadow-none">
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
        <Input
          ref={nameInputRef}
          type="text"
          value={nameValue}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onNameSave}
          onKeyDown={onNameKeyDown}
          onFocus={onNameFocus}
          spellCheck={false}
          maxLength={INPUT_LIMITS.PROJECT_NAME_MAX}
          className="text-2xl sm:text-3xl font-bold text-foreground bg-transparent dark:bg-transparent border-none outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full p-0 m-0 h-auto cursor-pointer hover:text-primary transition-colors break-words shadow-none"
          placeholder="Project name"
        />
      </div>
    </div>
  )
}
