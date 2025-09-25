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
      setNewTodo("") // Clear input after successful local add
    } catch (error) {
      // Only clear input if the todo was actually added locally
      // If addTodo throws, it means the local add failed completely
      console.error('Failed to add todo:', error)
      // Don't clear input - let user retry
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
