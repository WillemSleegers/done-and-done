"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSyncStatus } from "@/lib/hooks/useSyncStatus"

import FailedItemsSection from "./status/FailedItemsSection"
import RecentActivitySection from "./status/RecentActivitySection"
import SyncingItemsSection from "./status/SyncingItemsSection"

export default function AppStatus() {
  const {
    user,
    projects,
    dotColor,
    statusText,
    failedItems,
    syncingItems,
    recentActivities,
    retryFailedProject,
    retryFailedTodo,
  } = useSyncStatus()

  const hasSyncContent =
    user && (failedItems.length > 0 || syncingItems.length > 0 || recentActivities.length > 0)
  const showRecentActivity =
    user && recentActivities.length > 0 && failedItems.length === 0 && syncingItems.length === 0
  const showEmptyNoItems =
    user && failedItems.length === 0 && syncingItems.length === 0 && projects.length === 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-11 rounded-full hover:bg-muted">
          <div className={`w-3 h-3 rounded-full ${dotColor}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit min-w-48">
        <div className="p-3">
          {/* Status Header */}
          <div className={hasSyncContent ? "mb-3 pb-2 border-b border-border" : "mb-0"}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dotColor}`} />
              <span className="text-sm font-medium">{statusText}</span>
            </div>
          </div>

          {user && failedItems.length > 0 && (
            <FailedItemsSection
              items={failedItems}
              onRetryProject={retryFailedProject}
              onRetryTodo={retryFailedTodo}
            />
          )}

          {user && syncingItems.length > 0 && <SyncingItemsSection items={syncingItems} />}

          {showRecentActivity && <RecentActivitySection activities={recentActivities} />}

          {/* Empty State */}
          {!user && (
            <div className="text-center text-muted-foreground text-xs py-4">
              Sign in to sync your projects
            </div>
          )}
          {showEmptyNoItems && (
            <div className="text-center text-muted-foreground text-xs py-4">No items to sync</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
