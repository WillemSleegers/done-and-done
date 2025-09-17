"use client"

import { useState } from "react"
import { type Project } from "@/lib/services/syncService"
import { Plus } from "lucide-react"
import { useProjectStore } from "@/lib/store/projectStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

    setIsAdding(true)

    try {
      let projectToUse = project

      if (isNewProject) {
        // Create the real project first before adding todo
        await addProject({
          id: project.id, // Use the existing ID from the URL
          name: nameValue.trim() || "Untitled Project",
          notes: notesHtml || null,
          status: project.status,
          priority: project.priority,
        })

        // Remove the new flag from URL
        window.history.replaceState({}, "", `/projects/${project.id}`)
        onProjectCreated()
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

  return (
    <form onSubmit={handleAddTodo}>
      <div className="flex gap-2">
        <Input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 px-4 shadow-none"
        />
        <Button
          type="submit"
          disabled={!newTodo.trim() || isAdding}
          className="size-9"
        >
          {isAdding ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus size={20} />
          )}
        </Button>
      </div>
    </form>
  )
}
