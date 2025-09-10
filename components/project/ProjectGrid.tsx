'use client'

import { useState } from 'react'
import { type Project } from '@/lib/supabase'
import { Plus, FolderOpen } from 'lucide-react'
import NewProjectModal from './NewProjectModal'
import { useData } from '@/lib/DataProvider'

interface ProjectGridProps {
  onProjectSelect: (project: Project) => void
}

export default function ProjectGrid({ onProjectSelect }: ProjectGridProps) {
  const { projects, todoCounts, isLoading } = useData()
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
          My Projects
        </h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="w-full p-4 bg-card rounded-lg shadow-md border border-border"
            >
              <div className="flex flex-col h-24 justify-between">
                <div className="flex flex-col">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-muted rounded animate-pulse mb-1" />
                  <div className="w-full bg-muted rounded-full h-1.5 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
          
          {/* Add New Project Tile Skeleton */}
          <div className="p-4 border-2 border-dashed border-border rounded-lg">
            <div className="flex flex-col items-center justify-center h-24">
              <div className="w-6 h-6 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
          My Projects
        </h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {/* Project Tiles */}
          {projects.map((project) => {
            const counts = todoCounts[project.id] || { total: 0, completed: 0 }
            const progress = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0
            
            return (
              <button
                key={project.id}
                onClick={() => onProjectSelect(project)}
                className="w-full p-4 bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left border border-border"
              >
                <div className="flex flex-col h-24 justify-between">
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-foreground">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    {counts.total > 0 ? (
                      <>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{counts.completed}/{counts.total} completed</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-success h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground">No todos yet</div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}

          {/* Add New Project Tile */}
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-muted transition-all duration-200 group"
          >
            <div className="flex flex-col items-center justify-center h-24 text-muted-foreground group-hover:text-primary">
              <Plus size={24} className="mb-2" />
              <span className="text-sm font-medium">New Project</span>
            </div>
          </button>
        </div>

        {projects.length === 0 && (
          <div className="text-center text-muted-foreground mt-8">
            <FolderOpen size={48} className="mx-auto mb-4 text-muted" />
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        )}
      </div>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </>
  )
}