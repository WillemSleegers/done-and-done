"use client"

import { type SyncActivity } from "@/lib/syncActivityTracker"

interface RecentActivitySectionProps {
  activities: SyncActivity[]
}

const getActivityText = (activity: SyncActivity) => {
  const actionText =
    activity.action === "added"
      ? "Added"
      : activity.action === "updated"
        ? "Updated"
        : activity.action === "deleted"
          ? "Deleted"
          : activity.action === "completed"
            ? "Completed"
            : "Uncompleted"

  if (activity.type === "project") {
    return `${actionText} project: ${activity.name}`
  } else {
    return `${actionText}: ${activity.name}`
  }
}

export default function RecentActivitySection({ activities }: RecentActivitySectionProps) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
        Recent Activity
      </h4>
      <div className="space-y-1 max-h-24 overflow-y-auto">
        {activities.map((activity) => (
          <div key={`${activity.id}-${activity.timestamp}`} className="text-xs">
            <span className="truncate">{getActivityText(activity)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
