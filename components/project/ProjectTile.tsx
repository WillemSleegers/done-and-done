"use client"

import Link from "next/link"
import { type Project } from "@/lib/services/syncService"

interface ProjectTileProps {
  project: Project
  todoCounts: { total: number; completed: number }
}

export default function ProjectTile({ project, todoCounts }: ProjectTileProps) {
  const remainingTodos = todoCounts.total - todoCounts.completed

  // Priority-based background styling
  const getPriorityBackgroundClass = () => {
    switch (project.priority) {
      case "high":
        return "bg-priority-high text-priority-high-foreground"
      case "low":
        return "bg-priority-low text-priority-low-foreground"
      case "normal":
      default:
        return "bg-priority-normal text-priority-normal-foreground"
    }
  }

  // Status-based styling
  const getStatusStyles = () => {
    switch (project.status) {
      case "active":
        return {
          cardClass: "bg-card",
          titleClass: "text-foreground",
          opacity: "",
          showTodos: true,
        }
      case "inactive":
        return {
          cardClass: "bg-card",
          titleClass: "text-muted-foreground",
          opacity: "opacity-25 hover:opacity-90",
          showTodos: true,
        }
      case "complete":
        return {
          cardClass: "bg-card",
          titleClass: "text-muted-foreground",
          opacity: "opacity-25",
          showTodos: false,
        }
      default:
        return {
          cardClass: "bg-card",
          titleClass: "text-foreground",
          opacity: "",
          showTodos: true,
        }
    }
  }

  const styles = getStatusStyles()

  return (
    <Link
      href={`/projects/${project.id}`}
      className={`w-48 h-24 p-4 rounded-md transition-all duration-200 transform hover:scale-105 ${
        styles.opacity
      } ${getPriorityBackgroundClass()}`}
    >
      <div className="flex flex-col justify-center h-full">
        <h3
          className={`font-semibold text-lg truncate mb-1 ${styles.titleClass}`}
        >
          {project.name}
        </h3>

        <p className="text-sm opacity-70">
          {styles.showTodos && remainingTodos > 0 && (
            <>
              {remainingTodos} {remainingTodos === 1 ? "task" : "tasks"}
            </>
          )}

          {styles.showTodos &&
            remainingTodos === 0 &&
            todoCounts.total > 0 &&
            "All tasks complete"}

          {styles.showTodos && todoCounts.total === 0 && "No tasks yet"}

          {!styles.showTodos && "\u00A0"}
        </p>
      </div>
    </Link>
  )
}
