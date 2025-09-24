"use client"

import { useState, useRef, useEffect } from "react"
import { type Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"
import { format } from "date-fns"
import ProjectHeader from "./ProjectHeader"
import AddTodoForm from "./AddTodoForm"
import TodoList from "./todo-view/TodoList"
import { ProjectNotesEditor, type ProjectNotesEditorRef } from "./todo-view/ProjectNotesEditor"
import DatePickerDialog from "./dialogs/DatePickerDialog"
import DeleteProjectDialog from "./dialogs/DeleteProjectDialog"

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
  const [nameValue, setNameValue] = useState(project.name)
  const [notesValue, setNotesValue] = useState(project.notes || "")
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isNewProjectCreated, setIsNewProjectCreated] = useState(!isNewProject)

  const notesInputRef = useRef<ProjectNotesEditorRef>(null)

  const todos =
    isNewProject && !isNewProjectCreated ? [] : getProjectTodos(project.id)

  useEffect(() => {
    if (isNewProject) {
      setNameValue("")
    }
  }, [isNewProject])

  const handleNameSave = async () => {
    const trimmedName = nameValue.trim()

    if (isNewProject && !isNewProjectCreated && trimmedName) {
      try {
        await addProject({
          id: project.id, // Use the existing ID from the URL
          name: trimmedName,
          notes: notesInputRef.current?.getHTML() || null,
          status: project.status,
          priority: project.priority,
          order: project.order,
        })

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
      try {
        await addProject({
          id: project.id, // Use the existing ID from the URL
          name: nameValue.trim() || "Untitled Project",
          notes: htmlContent || null,
          status: project.status,
          priority: project.priority,
          order: project.order,
        })

        window.history.replaceState({}, "", `/projects/${project.id}`)
        setIsNewProjectCreated(true)
      } catch (error) {
        console.error("Failed to create project:", error)
        return
      }
    } else if (isNewProjectCreated && htmlContent !== (project.notes || "")) {
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
      notesInputRef.current?.blur()
    } else if (e.key === "Escape") {
      e.preventDefault()
      const originalContent = project.notes || ""
      setNotesValue(originalContent)
      notesInputRef.current?.setContent(originalContent)
      notesInputRef.current?.blur()
    }
  }

  const handleProjectCreated = () => {
    setIsNewProjectCreated(true)
  }

  const handleSetDueDate = async (todoId: string, date: Date | undefined) => {
    try {
      await updateTodo(todoId, {
        due_date: date ? format(date, "yyyy-MM-dd") : null,
      })
      setShowDateDialog(false)
      setDateDialogTodoId(null)
    } catch {
    }
  }

  const openDateDialog = (todoId: string) => {
    setDateDialogTodoId(todoId)
    setShowDateDialog(true)
  }


  const handleDeleteProject = async () => {
    try {
      await deleteProject(project.id)
      onBack() // Navigate back to project grid after deletion
    } catch {
      onBack()
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
        <TodoList
          todos={todos}
          projectId={project.id}
          onOpenDateDialog={openDateDialog}
        />

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
