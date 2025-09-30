'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthProvider'
import { useProjectStore } from '@/lib/store/projectStore'
import { syncActivityTracker, type SyncActivity } from '@/lib/syncActivityTracker'
import { Button } from '@/components/ui/button'

export default function ConnectionStatus() {
  const { user, loading } = useAuth()
  const { projects, todos, retryFailedProject, retryFailedTodo } = useProjectStore()
  const [isOnline, setIsOnline] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [recentActivities, setRecentActivities] = useState<SyncActivity[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Subscribe to activity tracker updates
  useEffect(() => {
    const updateActivities = () => {
      setRecentActivities(syncActivityTracker.getRecentActivities(5))
    }

    // Initial load
    updateActivities()

    // Subscribe to changes
    const unsubscribe = syncActivityTracker.subscribe(updateActivities)
    return unsubscribe
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate sync status
  const getSyncItems = () => {
    if (!user) return { syncingItems: [], failedItems: [] }

    const projectItems = projects.map(p => ({
      id: p.id,
      name: p.name,
      type: 'project' as const,
      status: p.syncState,
      projectId: null
    }))

    const todoItems = Object.values(todos).flat().map(t => ({
      id: t.id,
      name: t.text,
      type: 'todo' as const,
      status: t.syncState,
      projectId: t.project_id
    }))

    const allItems = [...projectItems, ...todoItems]

    return {
      syncingItems: allItems.filter(item => item.status === 'syncing' || item.status === 'local'),
      failedItems: allItems.filter(item => item.status === 'failed')
    }
  }

  const { syncingItems, failedItems } = getSyncItems()

  // Determine connection state with sync status
  const getConnectionState = () => {
    if (!isOnline) return 'offline'
    if (loading) return 'loading'
    if (!user) return 'no-auth'
    if (failedItems.length > 0) return 'sync-error'
    if (syncingItems.length > 0) return 'syncing'
    return 'connected'
  }

  const connectionState = getConnectionState()

  // Get dot color for status indicator
  const getDotColor = () => {
    switch (connectionState) {
      case 'offline':
        return 'bg-connection-offline'
      case 'loading':
        return 'bg-connection-loading animate-pulse'
      case 'no-auth':
        return 'bg-connection-no-auth'
      case 'sync-error':
        return 'bg-red-500'
      case 'syncing':
        return 'bg-blue-500 animate-pulse'
      case 'connected':
      default:
        return 'bg-connection-connected'
    }
  }

  // Get status text for header
  const getStatusText = () => {
    switch (connectionState) {
      case 'offline':
        return 'Offline'
      case 'loading':
        return 'Connecting...'
      case 'no-auth':
        return 'Not signed in'
      case 'sync-error':
        return `${failedItems.length} sync ${failedItems.length === 1 ? 'issue' : 'issues'}`
      case 'syncing':
        return `Syncing ${syncingItems.length} ${syncingItems.length === 1 ? 'item' : 'items'}`
      case 'connected':
      default:
        return 'All synced'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-muted rounded-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`w-3 h-3 rounded-full ${getDotColor()}`} />
      </Button>

      {/* Dropdown */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50">
          <div className="p-3">
            {/* Status Header */}
            <div className={`${user && (failedItems.length > 0 || syncingItems.length > 0 || recentActivities.length > 0) ? 'mb-3 pb-2 border-b border-border' : 'mb-0'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getDotColor()}`} />
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
            </div>

            {/* Failed Items */}
            {user && failedItems.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-destructive uppercase tracking-wide mb-2">
                  Failed to Sync
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {failedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                        <span className="text-muted-foreground">({item.type})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (item.type === 'project') {
                            retryFailedProject(item.id)
                          } else {
                            retryFailedTodo(item.id, item.projectId!)
                          }
                        }}
                        className="text-primary hover:text-primary/80 ml-2 flex-shrink-0 text-xs h-6 px-2"
                      >
                        Retry
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Syncing Items */}
            {user && syncingItems.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                  Currently Syncing
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {syncingItems.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                      <span className="truncate flex-1">{item.name}</span>
                      <span className="text-muted-foreground">({item.type})</span>
                    </div>
                  ))}
                  {syncingItems.length > 5 && (
                    <div className="text-xs text-muted-foreground pl-4">
                      +{syncingItems.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {user && recentActivities.length > 0 && failedItems.length === 0 && syncingItems.length === 0 && (
              <div>
                <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
                  Recent Activity
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {recentActivities.map(activity => {
                    const getActivityText = () => {
                      const actionText = activity.action === 'added' ? 'Added' :
                        activity.action === 'updated' ? 'Updated' :
                        activity.action === 'deleted' ? 'Deleted' :
                        activity.action === 'completed' ? 'Completed' :
                        'Uncompleted'

                      if (activity.type === 'project') {
                        return `${actionText} project: ${activity.name}`
                      } else {
                        return `${actionText}: ${activity.name}`
                      }
                    }

                    return (
                      <div key={`${activity.id}-${activity.timestamp}`} className="text-xs">
                        <span className="truncate">{getActivityText()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {failedItems.length === 0 && syncingItems.length === 0 && projects.length === 0 && (
              <div className="text-center text-muted-foreground text-xs py-4">
                No items to sync
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}