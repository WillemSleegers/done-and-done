"use client"

import { useState } from "react"
import { type Project } from "@/lib/services/syncService"
import { Plus } from "lucide-react"
import { useProjectStore } from "@/lib/store/projectStore"
import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

interface AddTodoFormProps {
  project: Project
  isNewProject?: boolean
  nameValue: string
  notesHtml: string | null
  onProjectCreated: () => void
}

export default function AddTodoForm({
  project,
  isNewProject = false,
  nameValue,
  notesHtml,
  onProjectCreated,
}: AddTodoFormProps) {
  const { addTodo, addProject } = useProjectStore()
  const [newTodo, setNewTodo] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || isAdding) return

    logger.userAction("Adding todo", {
      text: newTodo.trim(),
      projectId: project.id,
      projectName: nameValue || project.name,
      isNewProject,
    })

    setIsAdding(true)

    try {
      let projectToUse = project

      if (isNewProject) {
        logger.userAction("Creating new project with first todo", {
          projectId: project.id,
          projectName: nameValue.trim() || "Untitled Project",
          firstTodo: newTodo.trim(),
        })

        await addProject({
          id: project.id,
          name: nameValue.trim() || "Untitled Project",
          notes: notesHtml || null,
          status: project.status,
          priority: project.priority,
          order: project.order,
        })

        onProjectCreated()
        projectToUse = project // Use the same project object
      }

      await addTodo(projectToUse.id, newTodo.trim())
      logger.userAction("Todo added successfully")
      setNewTodo("") // Clear input after local add - let sync happen in background
    } catch (error) {
      // Even if there's an error, the optimistic update likely worked
      // Clear input so user can continue adding todos
      logger.error("Failed to add todo:", error)
      setNewTodo("")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <form onSubmit={handleAddTodo}>
      <div className="flex gap-2">
        <Input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 px-4 shadow-none text-base"
        />
        <Button type="submit" disabled={!newTodo.trim() || isAdding} className="size-9">
          {isAdding ? (
            <Spinner size="sm" className="border-primary-foreground" />
          ) : (
            <Plus size={20} />
          )}
        </Button>
      </div>
    </form>
  )
}
