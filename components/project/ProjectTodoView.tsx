"use client"

import { format } from "date-fns"
import { useRef, useState } from "react"

import { logger } from "@/lib/logger"
import { type Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"

import AddTodoForm from "./AddTodoForm"
import DatePickerDialog from "./dialogs/DatePickerDialog"
import DeleteProjectDialog from "./dialogs/DeleteProjectDialog"
import ProjectHeader from "./ProjectHeader"
import { ProjectNotesEditor, type ProjectNotesEditorRef } from "./todo-view/ProjectNotesEditor"
import TodoList from "./todo-view/TodoList"

interface ProjectTodoViewProps {
  project: Project
  onBack: () => void
}

export default function ProjectTodoView({ project, onBack }: ProjectTodoViewProps) {
  const getProjectTodos = useProjectStore((s) => s.getProjectTodos)
  const updateTodo = useProjectStore((s) => s.updateTodo)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const updateProject = useProjectStore((s) => s.updateProject)
  // Subscribed so this component re-renders when todos change — getProjectTodos()
  // is called below and reads live state, but the store won't notify us unless
  // we also select the state it reads.
  useProjectStore((s) => s.todos[project.id])
  const [showDateDialog, setShowDateDialog] = useState(false)
  const [dateDialogTodoId, setDateDialogTodoId] = useState<string | null>(null)
  const [nameValue, setNameValue] = useState(project.name)
  const [notesValue, setNotesValue] = useState(project.notes || "")
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const notesInputRef = useRef<ProjectNotesEditorRef>(null)
  const originalNameValueRef = useRef(project.name)

  const todos = getProjectTodos(project.id)

  const handleNameFocus = () => {
    originalNameValueRef.current = nameValue
  }

  const handleNameSave = async () => {
    const trimmedName = nameValue.trim()

    if (trimmedName && trimmedName !== project.name) {
      logger.userAction("Updating project name", {
        projectId: project.id,
        oldName: project.name,
        newName: trimmedName,
      })

      await updateProject(project.id, { name: trimmedName })
      logger.userAction("Project name updated successfully")
    } else if (!trimmedName) {
      logger.userAction("Resetting empty project name to original")
      setNameValue(project.name) // Reset to original
    }
  }

  const handleNotesSave = async () => {
    // Get plain text for comparison, but save HTML
    const htmlContent = notesInputRef.current?.getHTML() || ""
    const textContent = notesInputRef.current?.getText() || ""

    if (htmlContent !== (project.notes || "")) {
      logger.userAction("Updating project notes", {
        projectId: project.id,
        projectName: project.name,
        hasNotes: textContent.trim().length > 0,
        notesLength: textContent.trim().length,
      })

      updateProject(project.id, {
        notes: htmlContent || undefined,
      })
      logger.userAction("Project notes updated successfully")
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave()
      ;(e.target as HTMLInputElement).blur()
    } else if (e.key === "Escape") {
      setNameValue(originalNameValueRef.current)
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const handleNotesKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl + Enter saves and exits
      e.preventDefault()
      handleNotesSave()
      notesInputRef.current?.blur()
    } else if (e.key === "Escape") {
      e.preventDefault()
      const originalContent = project.notes || ""
      setNotesValue(originalContent)
      notesInputRef.current?.setContent(originalContent)
      notesInputRef.current?.blur()
    }
  }

  const handleSetDueDate = async (todoId: string, date: Date | undefined) => {
    try {
      await updateTodo(todoId, {
        due_date: date ? format(date, "yyyy-MM-dd") : null,
      })
      setShowDateDialog(false)
      setDateDialogTodoId(null)
    } catch (error) {
      logger.error("Failed to update todo due date", error)
    }
  }

  const openDateDialog = (todoId: string) => {
    setDateDialogTodoId(todoId)
    setShowDateDialog(true)
  }

  const handleDeleteProject = async () => {
    logger.userAction("Deleting project", {
      projectId: project.id,
      projectName: project.name,
      todoCount: todos.length,
    })

    try {
      await deleteProject(project.id)
      logger.userAction("Project deleted successfully")
      onBack() // Navigate back to project grid after deletion
    } catch (error) {
      logger.error("Failed to delete project", error)
      onBack()
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Project header */}
        <ProjectHeader
          project={project}
          nameValue={nameValue}
          onNameChange={setNameValue}
          onNameSave={handleNameSave}
          onNameKeyDown={handleNameKeyDown}
          onNameFocus={handleNameFocus}
          onDeleteProject={() => setShowDeleteAlert(true)}
        />

        {/* Add new todo form */}
        <AddTodoForm project={project} />

        {/* Todo list */}
        <TodoList todos={todos} projectId={project.id} onOpenDateDialog={openDateDialog} />

        {/* Notes section */}
        <ProjectNotesEditor
          ref={notesInputRef}
          value={notesValue}
          onChange={setNotesValue}
          onSave={handleNotesSave}
          onKeyDown={handleNotesKeyDown}
        />
      </div>

      {/* Dialogs */}
      <DeleteProjectDialog
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        project={project}
        onConfirmDelete={handleDeleteProject}
      />

      <DatePickerDialog
        open={showDateDialog}
        onOpenChange={setShowDateDialog}
        todos={todos}
        todoId={dateDialogTodoId}
        onSetDueDate={handleSetDueDate}
      />
    </div>
  )
}
