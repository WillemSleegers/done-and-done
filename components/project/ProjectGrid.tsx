"use client"

import { type Project } from "@/lib/services/syncService"
import { Plus, FolderOpen } from "lucide-react"
import { useProjectStore } from "@/lib/store/projectStore"
import { Button } from "@/components/ui/button"
import ProjectTile from "./ProjectTile"
import { DRAG_CONSTRAINTS, TOUCH_DELAYS } from "@/lib/constants"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable"

const getPriorityOrder = (priority: string): number => {
  switch (priority) {
    case "high":
      return 1
    case "normal":
      return 2
    case "low":
      return 3
    default:
      return 2
  }
}

const sortProjectsByPriority = (projects: Project[]) => {
  return [...projects].sort((a, b) => {
    const priorityOrderA = getPriorityOrder(a.priority)
    const priorityOrderB = getPriorityOrder(b.priority)
    if (priorityOrderA !== priorityOrderB) {
      return priorityOrderA - priorityOrderB
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

interface ProjectGridProps {
  onSelectProject: (project: Project) => void
  onCreateProject: () => void
}

export default function ProjectGrid({ onSelectProject, onCreateProject }: ProjectGridProps) {
  const { projects, todoCounts, reorderProjects, getProjectsSortedByOrder } = useProjectStore()

  const allProjectsSorted = getProjectsSortedByOrder()

  const activeProjects = allProjectsSorted.filter((p) => p.status === "active")
  const inactiveProjects = allProjectsSorted.filter((p) => p.status === "inactive")
  const completedProjects = allProjectsSorted.filter((p) => p.status === "complete")

  const sortedInactiveProjects = sortProjectsByPriority(inactiveProjects)

  const sortedCompletedProjects = [...completedProjects].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: DRAG_CONSTRAINTS.POINTER_DISTANCE,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_DELAYS.PROJECT_DRAG_ACTIVATION,
        tolerance: DRAG_CONSTRAINTS.TOUCH_TOLERANCE,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = activeProjects.findIndex((project) => project.id === active.id)
      const newIndex = activeProjects.findIndex((project) => project.id === over?.id)

      const newOrder = arrayMove(activeProjects, oldIndex, newIndex)
      await reorderProjects([...newOrder, ...inactiveProjects, ...completedProjects])
    }
  }

  const handleCreateProject = () => {
    onCreateProject()
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Main Projects Grid */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SortableContext
              items={activeProjects.map((project) => project.id)}
              strategy={rectSortingStrategy}
            >
              {/* Draggable Project Tiles */}
              {activeProjects.map((project) => {
                const counts = todoCounts[project.id] || {
                  total: 0,
                  completed: 0,
                }
                return (
                  <ProjectTile
                    key={project.id}
                    project={project}
                    todoCounts={counts}
                    onSelect={onSelectProject}
                  />
                )
              })}
            </SortableContext>

            {/* Add New Project Tile - Not draggable */}
            <Button
              variant="ghost"
              onClick={handleCreateProject}
              className="h-20 p-4 border-2 border-border border-dashed rounded-md hover:bg-accent/20 transition-all duration-200 transform hover:scale-105 group"
            >
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-foreground">
                <Plus size={24} className="mb-2" />
                <span className="text-sm font-medium">New Project</span>
              </div>
            </Button>
          </div>
        </DndContext>

        {/* Show inactive and completed projects in the main grid */}
        {sortedInactiveProjects.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Inactive Projects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedInactiveProjects.map((project) => {
                const counts = todoCounts[project.id] || { total: 0, completed: 0 }
                return (
                  <ProjectTile
                    key={project.id}
                    project={project}
                    todoCounts={counts}
                    onSelect={onSelectProject}
                  />
                )
              })}
            </div>
          </div>
        )}

        {sortedCompletedProjects.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Completed Projects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCompletedProjects.map((project) => {
                const counts = todoCounts[project.id] || { total: 0, completed: 0 }
                return (
                  <ProjectTile
                    key={project.id}
                    project={project}
                    todoCounts={counts}
                    onSelect={onSelectProject}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {projects.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">
          <FolderOpen size={48} className="mx-auto mb-4 text-muted" />
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      )}
    </div>
  )
}
