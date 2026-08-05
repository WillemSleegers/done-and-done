"use client"

import { DISPLAY_LIMITS } from "@/lib/constants"
import { type SyncItem } from "@/lib/hooks/useSyncStatus"

interface SyncingItemsSectionProps {
  items: SyncItem[]
}

export default function SyncingItemsSection({ items }: SyncingItemsSectionProps) {
  const visibleItems = items.slice(0, DISPLAY_LIMITS.SYNCING_ITEMS_PREVIEW)
  const hiddenCount = items.length - visibleItems.length

  return (
    <div className="mb-3">
      <h4 className="text-xs font-semibold text-connection-loading uppercase tracking-wide mb-2">
        Currently Syncing
      </h4>
      <div className="space-y-1 max-h-24 overflow-y-auto">
        {visibleItems.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-connection-loading animate-pulse shrink-0" />
            <span className="truncate flex-1">{item.name}</span>
            <span className="text-muted-foreground">({item.type})</span>
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="text-xs text-muted-foreground pl-4">+{hiddenCount} more</div>
        )}
      </div>
    </div>
  )
}
