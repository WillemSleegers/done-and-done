'use client'

import { useState } from 'react'
import { type Project } from '@/lib/supabase'
import { Plus, Check, X, ArrowLeft, MoreVertical } from 'lucide-react'
import { useData } from '@/lib/DataProvider'

interface ProjectTodoViewProps {
  project: Project
  onBack: () => void
}

export default function ProjectTodoView({ project, onBack }: ProjectTodoViewProps) {
  const { getProjectTodos, addTodo, updateTodo, deleteTodo, deleteProject } = useData()
  const [newTodo, setNewTodo] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const todos = getProjectTodos(project.id)

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || isAdding) return

    setIsAdding(true)
    try {
      await addTodo(project.id, newTodo.trim())
      setNewTodo('')
    } catch {
      // Todo creation failed, but this is handled by the DataProvider
      // The todo will appear with sync status indicator and retry automatically
      // Still clear the form since the todo is now visible in the list
      setNewTodo('')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateTodo(id, { completed: !completed })
    } catch {
      // Error updating todo - will be retried by DataProvider
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id, project.id)
    } catch {
      // Delete operation failed, but this is handled by the DataProvider
      // The todo will be marked for deletion and retried automatically
    }
  }

  const handleDeleteProject = async () => {
    if (confirm(`Delete project "${project.name}"? This will also delete all its todos.`)) {
      try {
        await deleteProject(project.id)
        onBack() // Navigate back to project grid after deletion
      } catch {
        // Project deletion will retry in background
        onBack() // Still navigate back since it was optimistically removed
      }
    }
    setShowDropdown(false)
  }


  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        {/* Header with back button and project info */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 p-2 -ml-2 rounded-lg hover:bg-muted"
          >
            <ArrowLeft size={20} />
            <span>Back to Projects</span>
          </button>
          
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">
              {project.name}
            </h1>
            
            {/* Project dropdown menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
              >
                <MoreVertical size={20} />
              </button>
              
              {showDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDropdown(false)}
                  />
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-popover rounded-lg shadow-lg border border-border z-20">
                    <button
                      onClick={handleDeleteProject}
                      className="w-full px-4 py-2 text-left text-destructive hover:bg-muted rounded-lg flex items-center gap-2"
                    >
                      <X size={16} />
                      Delete Project
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {project.description && (
            <p className="text-muted-foreground text-sm ml-9">
              {project.description}
            </p>
          )}
        </div>

        {/* Add new todo form */}
        <form onSubmit={handleAddTodo} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base bg-background"
            />
            <button
              type="submit"
              disabled={!newTodo.trim() || isAdding}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus size={20} />
              )}
            </button>
          </div>
        </form>

        {/* Todo list */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>No todos yet in this project.</p>
              <p className="text-sm mt-1">Add one above to get started!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                  todo.completed 
                    ? 'bg-muted border-border' 
                    : 'bg-card border-border shadow-sm'
                }`}
              >
                <button
                  onClick={() => handleToggleTodo(todo.id, todo.completed)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    todo.completed
                      ? 'border-success text-success-foreground'
                      : 'border-border hover:border-success'
                  }`}
                  style={{ 
                    backgroundColor: todo.completed ? 'hsl(var(--success))' : 'transparent'
                  }}
                >
                  {todo.completed && <Check size={14} />}
                </button>
                
                <span
                  className={`flex-1 text-base ${
                    todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {todo.text}
                </span>
                
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="flex-shrink-0 text-destructive hover:text-destructive/80 p-1"
                >
                  <X size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        {todos.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-sm border border-border">
              <span className="text-sm text-muted-foreground">
                {todos.filter(t => !t.completed).length} of {todos.length} remaining
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}