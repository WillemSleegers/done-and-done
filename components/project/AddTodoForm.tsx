"use client"

import { Plus } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { INPUT_LIMITS } from "@/lib/constants"
import { logger } from "@/lib/logger"
import { type Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"

interface AddTodoFormProps {
  project: Project
}

export default function AddTodoForm({ project }: AddTodoFormProps) {
  const addTodo = useProjectStore((s) => s.addTodo)
  const [newTodo, setNewTodo] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || isAdding) return

    logger.userAction("Adding todo", {
      text: newTodo.trim(),
      projectId: project.id,
      projectName: project.name,
    })

    setIsAdding(true)

    try {
      await addTodo(project.id, newTodo.trim())
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
      <div className="flex gap-4">
        <Input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
          maxLength={INPUT_LIMITS.TODO_TEXT_MAX}
          className="flex-1 px-4 py-2 h-10 shadow-none text-base"
        />
        <Button type="submit" disabled={!newTodo.trim() || isAdding} size="icon">
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
