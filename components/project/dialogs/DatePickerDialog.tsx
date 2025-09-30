"use client"

import { type Todo } from "@/lib/services/syncService"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"

interface DatePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  todos: Todo[]
  todoId: string | null
  onSetDueDate: (todoId: string, date: Date | undefined) => Promise<void>
}

export default function DatePickerDialog({
  open,
  onOpenChange,
  todos,
  todoId,
  onSetDueDate,
}: DatePickerDialogProps) {
  const selectedTodo = todoId ? todos.find((t) => t.id === todoId) : null
  const selectedDate = selectedTodo?.due_date ? new Date(selectedTodo.due_date) : undefined

  const handleDateSelect = (date: Date | undefined) => {
    if (todoId) {
      onSetDueDate(todoId, date)
    }
  }

  const handleRemoveDueDate = () => {
    if (todoId) {
      onSetDueDate(todoId, undefined)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-auto max-w-fit p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Set due date</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-4">
          <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} autoFocus />
        </div>
        {selectedTodo?.due_date && (
          <div className="flex justify-center px-6 pb-6">
            <Button variant="outline" onClick={handleRemoveDueDate}>
              Remove due date
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
