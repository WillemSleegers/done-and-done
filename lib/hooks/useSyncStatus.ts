"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/lib/AuthProvider"
import { DISPLAY_LIMITS } from "@/lib/constants"
import { useProjectStore } from "@/lib/store/projectStore"
import { type SyncState } from "@/lib/supabase"
import { type SyncActivity, syncActivityTracker } from "@/lib/syncActivityTracker"

export interface SyncItem {
  id: string
  name: string
  type: "project" | "todo"
  status: SyncState
  projectId: string | null
}

type ConnectionState = "offline" | "loading" | "no-auth" | "sync-error" | "syncing" | "connected"

const getDotColor = (connectionState: ConnectionState) => {
  switch (connectionState) {
    case "offline":
      return "bg-connection-offline"
    case "loading":
      return "bg-connection-loading animate-pulse"
    case "no-auth":
      return "bg-connection-no-auth"
    case "sync-error":
      return "bg-red-500"
    case "syncing":
      return "bg-blue-500 animate-pulse"
    case "connected":
    default:
      return "bg-connection-connected"
  }
}

const getStatusText = (
  connectionState: ConnectionState,
  failedItems: SyncItem[],
  syncingItems: SyncItem[]
) => {
  switch (connectionState) {
    case "offline":
      return "Offline"
    case "loading":
      return "Connecting..."
    case "no-auth":
      return "Not signed in"
    case "sync-error":
      return `${failedItems.length} sync ${failedItems.length === 1 ? "issue" : "issues"}`
    case "syncing":
      return `Syncing ${syncingItems.length} ${syncingItems.length === 1 ? "item" : "items"}`
    case "connected":
    default:
      return "All synced"
  }
}

export function useSyncStatus() {
  const { user, loading } = useAuth()
  const { projects, todos, retryFailedProject, retryFailedTodo } = useProjectStore()
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine
  )
  const [recentActivities, setRecentActivities] = useState<SyncActivity[]>([])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Subscribe to activity tracker updates
  useEffect(() => {
    const updateActivities = () => {
      setRecentActivities(
        syncActivityTracker.getRecentActivities(DISPLAY_LIMITS.RECENT_ACTIVITY_COUNT)
      )
    }

    // Initial load
    updateActivities()

    // Subscribe to changes
    const unsubscribe = syncActivityTracker.subscribe(updateActivities)
    return unsubscribe
  }, [])

  const projectItems: SyncItem[] = user
    ? projects.map((p) => ({
        id: p.id,
        name: p.name,
        type: "project",
        status: p.syncState,
        projectId: null,
      }))
    : []

  const todoItems: SyncItem[] = user
    ? Object.values(todos)
        .flat()
        .map((t) => ({
          id: t.id,
          name: t.text,
          type: "todo",
          status: t.syncState,
          projectId: t.project_id,
        }))
    : []

  const allItems = [...projectItems, ...todoItems]

  const syncingItems = allItems.filter(
    (item) => item.status === "syncing" || item.status === "local"
  )
  const failedItems = allItems.filter((item) => item.status === "failed")

  const connectionState: ConnectionState = !isOnline
    ? "offline"
    : loading
      ? "loading"
      : !user
        ? "no-auth"
        : failedItems.length > 0
          ? "sync-error"
          : syncingItems.length > 0
            ? "syncing"
            : "connected"

  return {
    user,
    projects,
    dotColor: getDotColor(connectionState),
    statusText: getStatusText(connectionState, failedItems, syncingItems),
    failedItems,
    syncingItems,
    recentActivities,
    retryFailedProject,
    retryFailedTodo,
  }
}
