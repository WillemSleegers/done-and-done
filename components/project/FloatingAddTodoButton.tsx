"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"
import { type Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"

interface FloatingAddTodoButtonProps {
  project: Project
}

export default function FloatingAddTodoButton({ project }: FloatingAddTodoButtonProps) {
  const addTodo = useProjectStore((s) => s.addTodo)

  const handleAdd = async () => {
    logger.userAction("Adding blank todo via floating button", { projectId: project.id })

    try {
      await addTodo(project.id, "")
    } catch (error) {
      logger.error("Failed to add blank todo", error)
    }
  }

  return (
    <Button
      type="button"
      size="icon"
      onClick={handleAdd}
      className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 size-12 shadow-lg sm:hidden"
    >
      <Plus className="size-6" />
    </Button>
  )
}
