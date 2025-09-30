"use client"

import { useState, useRef, useEffect } from "react"
import { type Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"
import { format } from "date-fns"
import { logger } from "@/lib/logger"
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
  const originalNameValueRef = useRef(project.name)

  const todos =
    isNewProject && !isNewProjectCreated ? [] : getProjectTodos(project.id)

  useEffect(() => {
    if (isNewProject) {
      setNameValue("")
      originalNameValueRef.current = ""
    }
  }, [isNewProject])

  const handleNameFocus = () => {
    originalNameValueRef.current = nameValue
  }

  const handleNameSave = async () => {
    const trimmedName = nameValue.trim()

    if (isNewProject && !isNewProjectCreated && trimmedName) {
      logger.userAction('Creating new project via name save', {
        projectId: project.id,
        name: trimmedName,
        status: project.status,
        priority: project.priority
      })

      try {
        await addProject({
          id: project.id, // Use the existing ID from the URL
          name: trimmedName,
          notes: notesInputRef.current?.getHTML() || null,
          status: project.status,
          priority: project.priority,
          order: project.order,
        })

        logger.userAction('Project created successfully via name save')
        window.history.replaceState({}, "", `/?project=${project.id}`)
        setIsNewProjectCreated(true)
      } catch (error) {
        logger.error("Failed to create project:", error)
        return
      }
    } else if (
      isNewProjectCreated &&
      trimmedName &&
      trimmedName !== project.name
    ) {
      logger.userAction('Updating project name', {
        projectId: project.id,
        oldName: project.name,
        newName: trimmedName
      })

      // Update the project in the store
      await updateProject(project.id, { name: trimmedName })
      logger.userAction('Project name updated successfully')
    } else if (!trimmedName) {
      logger.userAction('Resetting empty project name to original')
      setNameValue(project.name) // Reset to original
    }
  }

  const handleNotesSave = async () => {
    // Get plain text for comparison, but save HTML
    const htmlContent = notesInputRef.current?.getHTML() || ""
    const textContent = notesInputRef.current?.getText() || ""
    const trimmedText = textContent.trim()

    if (isNewProject && !isNewProjectCreated && trimmedText) {
      logger.userAction('Creating new project via notes save', {
        projectId: project.id,
        name: nameValue.trim() || "Untitled Project",
        hasNotes: trimmedText.length > 0
      })

      try {
        await addProject({
          id: project.id, // Use the existing ID from the URL
          name: nameValue.trim() || "Untitled Project",
          notes: htmlContent || null,
          status: project.status,
          priority: project.priority,
          order: project.order,
        })

        logger.userAction('Project created successfully via notes save')
        window.history.replaceState({}, "", `/?project=${project.id}`)
        setIsNewProjectCreated(true)
      } catch (error) {
        logger.error("Failed to create project:", error)
        return
      }
    } else if (isNewProjectCreated && htmlContent !== (project.notes || "")) {
      logger.userAction('Updating project notes', {
        projectId: project.id,
        projectName: project.name,
        hasNotes: trimmedText.length > 0,
        notesLength: trimmedText.length
      })

      updateProject(project.id, {
        notes: htmlContent || undefined,
      })
      logger.userAction('Project notes updated successfully')
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
    } catch (error) {
      logger.error('Failed to update todo due date', error)
    }
  }

  const openDateDialog = (todoId: string) => {
    setDateDialogTodoId(todoId)
    setShowDateDialog(true)
  }


  const handleDeleteProject = async () => {
    logger.userAction('Deleting project', {
      projectId: project.id,
      projectName: project.name,
      todoCount: todos.length
    })

    try {
      await deleteProject(project.id)
      logger.userAction('Project deleted successfully')
      onBack() // Navigate back to project grid after deletion
    } catch (error) {
      logger.error('Failed to delete project', error)
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
          onNameFocus={handleNameFocus}
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
