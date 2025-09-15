"use client"

import { useState, useRef, useEffect } from "react"
import { type Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"
import {
  RichTextEditor,
  type RichTextEditorRef,
} from "@/components/ui/rich-text-editor"
import { Button } from "@/components/ui/button"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import ProjectHeader from "./ProjectHeader"
import TodoItem from "./TodoItem"
import AddTodoForm from "./AddTodoForm"

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
    updateTodo,
    deleteProject,
    updateProject,
    addProject,
  } = useProjectStore()
  const [showDateDialog, setShowDateDialog] = useState(false)
  const [dateDialogTodoId, setDateDialogTodoId] = useState<string | null>(null)
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [nameValue, setNameValue] = useState(project.name)
  const [notesValue, setNotesValue] = useState(project.notes || "")
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isNewProjectCreated, setIsNewProjectCreated] = useState(!isNewProject)

  const notesInputRef = useRef<RichTextEditorRef>(null)

  const todos =
    isNewProject && !isNewProjectCreated ? [] : getProjectTodos(project.id)

  useEffect(() => {
    if (isNewProject) {
      // Clear the field for new projects so user can start fresh
      setNameValue("")
    }
  }, [isNewProject])

  const handleNameSave = async () => {
    const trimmedName = nameValue.trim()

    if (isNewProject && !isNewProjectCreated && trimmedName) {
      // First edit of a new project - create the real project now
      try {
        await addProject({
          id: project.id, // Use the existing ID from the URL
          name: trimmedName,
          notes: notesInputRef.current?.getHTML() || null,
          status: project.status,
          priority: project.priority,
        })

        // Remove the new flag from URL
        window.history.replaceState({}, "", `/projects/${project.id}`)
        setIsNewProjectCreated(true)
      } catch (error) {
        console.error("Failed to create project:", error)
        return
      }
    } else if (
      isNewProjectCreated &&
      trimmedName &&
      trimmedName !== project.name
    ) {
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

    if (isNewProject && !isNewProjectCreated && trimmedText) {
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
        setIsNewProjectCreated(true)
      } catch (error) {
        console.error("Failed to create project:", error)
        return
      }
    } else if (isNewProjectCreated && htmlContent !== (project.notes || "")) {
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

  const handleProjectCreated = () => {
    setIsNewProjectCreated(true)
  }

  const handleSetDueDate = async (todoId: string, date: Date | undefined) => {
    try {
      await updateTodo(todoId, {
        due_date: date ? format(date, "yyyy-MM-dd") : null,
      })
      setShowDateDialog(false) // Close the dialog
      setDateDialogTodoId(null)
    } catch {
      // Error updating todo - sync service will retry
    }
  }

  const openDateDialog = (todoId: string) => {
    setDateDialogTodoId(todoId)
    setShowDateDialog(true)
  }

  const cancelEditing = () => {
    setEditingTodoId(null)
  }

  const saveEdit = async (text: string) => {
    if (!editingTodoId || !text.trim()) return

    try {
      await updateTodo(editingTodoId, { text: text.trim() })
      setEditingTodoId(null)
    } catch {
      // Error updating todo - sync service will retry
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

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Project header */}
        <ProjectHeader
          project={project}
          isNewProject={isNewProject && !isNewProjectCreated}
          nameValue={nameValue}
          onNameChange={setNameValue}
          onNameSave={handleNameSave}
          onNameKeyDown={handleNameKeyDown}
          onDeleteProject={() => setShowDeleteAlert(true)}
        />

        {/* Add new todo form */}
        <AddTodoForm
          project={project}
          isNewProject={isNewProject && !isNewProjectCreated}
          nameValue={nameValue}
          notesHtml={notesInputRef.current?.getHTML() || null}
          onProjectCreated={handleProjectCreated}
        />

        {/* Todo list */}
        <div className="space-y-3">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              projectId={project.id}
              isEditing={editingTodoId === todo.id}
              onStartEditing={() => setEditingTodoId(todo.id)}
              onCancelEditing={cancelEditing}
              onSaveEdit={saveEdit}
              onOpenDateDialog={() => openDateDialog(todo.id)}
            />
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

      {/* Date picker dialog */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent className="w-auto max-w-fit p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Set due date</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-4">
            <Calendar
              mode="single"
              selected={
                dateDialogTodoId
                  ? todos.find((t) => t.id === dateDialogTodoId)?.due_date
                    ? new Date(
                        todos.find((t) => t.id === dateDialogTodoId)!.due_date!
                      )
                    : undefined
                  : undefined
              }
              onSelect={(date) => {
                if (dateDialogTodoId) {
                  handleSetDueDate(dateDialogTodoId, date)
                }
              }}
              autoFocus
            />
          </div>
          {dateDialogTodoId &&
            todos.find((t) => t.id === dateDialogTodoId)?.due_date && (
              <div className="flex justify-center px-6 pb-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (dateDialogTodoId) {
                      handleSetDueDate(dateDialogTodoId, undefined)
                    }
                  }}
                >
                  Remove due date
                </Button>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
