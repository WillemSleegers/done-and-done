"use client"

import { useState, useRef, useEffect } from "react"
import { type Project } from "@/lib/services/syncService"
import { type ProjectStatus, type ProjectPriority } from "@/lib/supabase"
import { Plus, Check, X, ArrowLeft } from "lucide-react"
import { useProjectStore } from "@/lib/store/projectStore"
import {
  RichTextEditor,
  type RichTextEditorRef,
} from "@/components/ui/rich-text-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProjectTodoViewProps {
  project: Project
  onBack: () => void
  isNewProject?: boolean
}

export default function ProjectTodoView({
  project,
  onBack,
  isNewProject = false,
}: ProjectTodoViewProps) {
  const {
    getProjectTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    deleteProject,
    updateProject,
    addProject,
  } = useProjectStore()
  const [newTodo, setNewTodo] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [nameValue, setNameValue] = useState(project.name)
  const [notesValue, setNotesValue] = useState(project.notes || "")
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const notesInputRef = useRef<RichTextEditorRef>(null)

  const todos = isNewProject ? [] : getProjectTodos(project.id)

  useEffect(() => {
    if (isNewProject && nameInputRef.current) {
      nameInputRef.current.focus()
      // Clear the field for new projects so user can start fresh
      setNameValue("")
    }
  }, [isNewProject])

  const handleNameSave = async () => {
    const trimmedName = nameValue.trim()

    if (isNewProject && trimmedName) {
      // First edit of a new project - create the real project now
      try {
        await addProject({
          id: project.id, // Use the existing ID from the URL
          name: trimmedName,
          notes: notesValue.trim() || null,
          status: project.status,
          priority: project.priority,
        })

        // Remove the new flag from URL
        window.history.replaceState({}, "", `/projects/${project.id}`)
      } catch (error) {
        console.error("Failed to create project:", error)
        return
      }
    } else if (!isNewProject && trimmedName && trimmedName !== project.name) {
      // Normal edit of existing project
      updateProject(project.id, { name: trimmedName })
    } else if (!trimmedName) {
      setNameValue(project.name) // Reset to original
    }
  }

  const handleNotesSave = async () => {
    // Get plain text for comparison, but save HTML
    const htmlContent = notesInputRef.current?.getHTML() || ""
    const textContent = notesInputRef.current?.getText() || ""
    const trimmedText = textContent.trim()

    if (isNewProject && trimmedText) {
      // First edit of a new project - create the real project now
      try {
        await addProject({
          id: project.id, // Use the existing ID from the URL
          name: nameValue.trim() || "Untitled Project",
          notes: htmlContent || null,
          status: project.status,
          priority: project.priority,
        })

        // Remove the new flag from URL
        window.history.replaceState({}, "", `/projects/${project.id}`)
      } catch (error) {
        console.error("Failed to create project:", error)
        return
      }
    } else if (!isNewProject && htmlContent !== (project.notes || "")) {
      // Normal edit of existing project
      updateProject(project.id, {
        notes: htmlContent || undefined,
      })
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave()
    } else if (e.key === "Escape") {
      setNameValue(project.name)
    }
  }

  const handleNotesKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl + Enter saves and exits
      e.preventDefault()
      handleNotesSave()
      notesInputRef.current?.blur() // Remove focus to "finish" editing
    } else if (e.key === "Escape") {
      e.preventDefault()
      const originalContent = project.notes || ""
      setNotesValue(originalContent)
      notesInputRef.current?.setContent(originalContent)
      notesInputRef.current?.blur() // Remove focus to cancel editing
    }
    // Regular Enter key will create a new line (default behavior)
  }

  const handleStatusChange = (newStatus: ProjectStatus) => {
    updateProject(project.id, { status: newStatus })
  }

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || isAdding) return

    setIsAdding(true)

    try {
      let projectToUse = project

      if (isNewProject) {
        // Create the real project first before adding todo
        await addProject({
          id: project.id, // Use the existing ID from the URL
          name: nameValue.trim() || "Untitled Project",
          notes: notesInputRef.current?.getHTML() || null,
          status: project.status,
          priority: project.priority,
        })

        // Remove the new flag from URL
        window.history.replaceState({}, "", `/projects/${project.id}`)
        projectToUse = project // Use the same project object
      }

      await addTodo(projectToUse.id, newTodo.trim())
      setNewTodo("")
    } catch {
      // Todo creation failed, but sync service handles retries
      // The todo will appear with sync status indicator and retry automatically
      // Still clear the form since the todo is now visible in the list
      setNewTodo("")
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateTodo(id, { completed: !completed })
    } catch {
      // Error updating todo - sync service will retry
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id, project.id)
    } catch {
      // Delete operation failed, but sync service handles retries
      // The todo will be marked for deletion and retried automatically
    }
  }

  const handleDeleteProject = async () => {
    try {
      await deleteProject(project.id)
      onBack() // Navigate back to project grid after deletion
    } catch {
      // Project deletion will retry in background
      onBack() // Still navigate back since it was optimistically removed
    }
  }

  const handlePriorityChange = async (priority: ProjectPriority) => {
    try {
      await updateProject(project.id, { priority })
    } catch {
      // Priority update will retry in background
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header with back button and project info */}
        <div>
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 p-2 -ml-2 rounded-lg hover:bg-muted"
          >
            <ArrowLeft size={20} />
            <span>Back to Projects</span>
          </Button>

          <div className="flex items-center justify-between mb-2">
            <input
              ref={nameInputRef}
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              className="text-2xl font-bold text-foreground bg-transparent border-none outline-none focus:outline-none flex-1 mr-4 p-0 m-0 cursor-pointer hover:text-primary transition-colors"
              placeholder="Project name"
            />

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Status dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 shadow-none"
                    disabled={isNewProject}
                  >
                    {project.status.charAt(0).toUpperCase() +
                      project.status.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                    {project.priority.charAt(0).toUpperCase() +
                      project.priority.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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

              {/* Delete button */}
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10 shadow-none"
                onClick={() => setShowDeleteAlert(true)}
                disabled={isNewProject}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Add new todo form */}
        <form onSubmit={handleAddTodo}>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 h-10 px-4 text-base shadow-none"
            />
            <Button
              type="submit"
              disabled={!newTodo.trim() || isAdding}
              className="h-10 w-10"
            >
              {isAdding ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus size={20} />
              )}
            </Button>
          </div>
        </form>

        {/* Todo list */}
        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 h-10 ps-3 pe-2 rounded-lg border transition-all cursor-pointer hover:bg-accent/50 bg-card ${
                todo.completed ? "border-border" : "border-border"
              }`}
              onClick={() => handleToggleTodo(todo.id, todo.completed)}
            >
              <div
                className={`flex-shrink-0 size-4 rounded-full border-1 transition-all flex items-center justify-center ${
                  todo.completed
                    ? "border-success text-success-foreground"
                    : "border-border hover:border-success"
                }`}
              >
                {todo.completed && <Check size={14} />}
              </div>

              <span
                className={`flex-1 text-base ${
                  todo.completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {todo.text}
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteTodo(todo.id)}
                className="flex-shrink-0 text-destructive hover:text-destructive/80 h-8 w-8"
              >
                <X size={18} />
              </Button>
            </div>
          ))}
        </div>

        {/* Notes section */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Notes</h3>
          <RichTextEditor
            ref={notesInputRef}
            content={notesValue}
            onUpdate={setNotesValue}
            onBlur={handleNotesSave}
            onKeyDown={handleNotesKeyDown}
            placeholder="Add notes..."
            className="text-muted-foreground text-sm leading-5 bg-transparent border-none outline-none focus:outline-none w-full cursor-pointer"
          />
        </div>
      </div>

      {/* Delete Project Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{project.name}&rdquo;? This
              will also delete all its todos. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteAlert(false)
                handleDeleteProject()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
