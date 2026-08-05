"use client"

import { Check, MoreHorizontal, Plus, Tag, Trash, X } from "lucide-react"
import { useRef, useState } from "react"

import PriorityBadge from "@/components/project/PriorityBadge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { INPUT_LIMITS } from "@/lib/constants"
import { logger } from "@/lib/logger"
import { type Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"
import { type ProjectPriority, type ProjectStatus } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface ProjectHeaderProps {
  project: Project
  nameValue: string
  onNameChange: (value: string) => void
  onNameSave: () => Promise<void>
  onNameKeyDown: (e: React.KeyboardEvent) => void
  onNameFocus: () => void
  onDeleteProject: () => void
}

export default function ProjectHeader({
  project,
  nameValue,
  onNameChange,
  onNameSave,
  onNameKeyDown,
  onNameFocus,
  onDeleteProject,
}: ProjectHeaderProps) {
  const updateProject = useProjectStore((s) => s.updateProject)
  const projects = useProjectStore((s) => s.projects)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")

  const categorySuggestions = Array.from(
    new Set(projects.map((p) => p.category).filter((category): category is string => !!category))
  ).sort((a, b) => a.localeCompare(b))

  const trimmedSearch = categorySearch.trim()
  const searchMatchesExisting = categorySuggestions.some(
    (category) => category.toLowerCase() === trimmedSearch.toLowerCase()
  )

  const handleCategorySelect = async (category: string | null) => {
    logger.userAction("Changing project category", {
      projectId: project.id,
      projectName: project.name,
      oldCategory: project.category,
      newCategory: category,
    })

    setCategoryOpen(false)
    setCategorySearch("")

    try {
      await updateProject(project.id, { category })
      logger.userAction("Project category changed successfully")
    } catch (error) {
      logger.error("Failed to change project category", error)
    }
  }

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
            <Button variant="outline" className="gap-2">
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
            <Button variant="outline">
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

        {/* Category combobox */}
        <Popover
          open={categoryOpen}
          onOpenChange={(open) => {
            setCategoryOpen(open)
            if (!open) setCategorySearch("")
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Tag size={16} className={project.category ? "" : "text-muted-foreground"} />
              {project.category || "Add category"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-0">
            <Command>
              <CommandInput
                placeholder="Search or create category..."
                value={categorySearch}
                onValueChange={setCategorySearch}
                maxLength={INPUT_LIMITS.CATEGORY_MAX}
              />
              <CommandList>
                <CommandEmpty>
                  {trimmedSearch ? (
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(trimmedSearch)}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <Plus size={14} />
                      Create &ldquo;{trimmedSearch}&rdquo;
                    </button>
                  ) : (
                    <span className="text-muted-foreground">No categories yet</span>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {!trimmedSearch && project.category && (
                    <CommandItem
                      onSelect={() => handleCategorySelect(null)}
                      className="text-muted-foreground"
                    >
                      <X size={14} />
                      No category
                    </CommandItem>
                  )}
                  {categorySuggestions.map((category) => (
                    <CommandItem
                      key={category}
                      value={category}
                      onSelect={() => handleCategorySelect(category)}
                    >
                      <Check
                        size={14}
                        className={cn(category === project.category ? "opacity-100" : "opacity-0")}
                      />
                      {category}
                    </CommandItem>
                  ))}
                  {trimmedSearch && !searchMatchesExisting && (
                    <CommandItem
                      value={trimmedSearch}
                      onSelect={() => handleCategorySelect(trimmedSearch)}
                    >
                      <Plus size={14} />
                      Create &ldquo;{trimmedSearch}&rdquo;
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
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
          className="text-2xl sm:text-3xl font-bold text-foreground bg-transparent dark:bg-transparent border-none outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full p-0 m-0 h-auto wrap-break-word shadow-none"
          placeholder="Project name"
        />
      </div>
    </div>
  )
}
