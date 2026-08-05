"use client"

import { Button } from "@/components/ui/button"
import { type SyncItem } from "@/lib/hooks/useSyncStatus"

interface FailedItemsSectionProps {
  items: SyncItem[]
  onRetryProject: (projectId: string) => void
  onRetryTodo: (todoId: string, projectId: string) => void
}

export default function FailedItemsSection({
  items,
  onRetryProject,
  onRetryTodo,
}: FailedItemsSectionProps) {
  return (
    <div className="mb-3">
      <h4 className="text-xs font-semibold text-destructive uppercase tracking-wide mb-2">
        Failed to Sync
      </h4>
      <div className="space-y-1 max-h-24 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
              <span className="truncate">{item.name}</span>
              <span className="text-muted-foreground">({item.type})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (item.type === "project") {
                  onRetryProject(item.id)
                } else {
                  onRetryTodo(item.id, item.projectId!)
                }
              }}
              className="text-primary hover:text-primary/80 ml-2 shrink-0 text-xs h-6 px-2"
            >
              Retry
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
