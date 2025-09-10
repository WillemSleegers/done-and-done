'use client'

import { useState } from 'react'
import { useData } from '@/lib/DataProvider'
import { AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'

export default function SyncStatus() {
  const { projects, todos, retryFailedProject, retryFailedTodo } = useData()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRetryingAll, setIsRetryingAll] = useState(false)

  // Calculate sync status
  const getAllItems = () => {
    const projectItems = projects.map(p => ({
      id: p.id,
      name: p.name,
      type: 'project' as const,
      status: p.syncState,
      projectId: null // projects don't need projectId for retry
    }))
    
    const todoItems = Object.values(todos).flat().map(t => ({
      id: t.id,
      name: t.text,
      type: 'todo' as const,
      status: t.syncState,
      projectId: t.project_id // todos need projectId for retry
    }))
    
    return [...projectItems, ...todoItems]
  }

  const allItems = getAllItems()
  const pendingItems = allItems.filter(item => item.status === 'syncing' || item.status === 'local')
  const failedItems = allItems.filter(item => item.status === 'failed')
  
  // Only show popup for actual problems (failed items), not normal syncing
  const totalUnsynced = failedItems.length

  // Retry all failed items
  const handleRetryAll = async () => {
    if (failedItems.length === 0 || isRetryingAll) return
    
    setIsRetryingAll(true)
    
    try {
      // Retry all failed items in parallel
      const retryPromises = failedItems.map(item => {
        if (item.type === 'project') {
          return retryFailedProject(item.id)
        } else {
          return retryFailedTodo(item.id, item.projectId!)
        }
      })
      
      await Promise.allSettled(retryPromises)
    } finally {
      setIsRetryingAll(false)
    }
  }

  if (totalUnsynced === 0) {
    return null // Clean UI when everything is synced
  }

  const getStatusConfig = () => {
    if (failedItems.length > 0) {
      return {
        icon: <AlertCircle size={16} />,
        text: `${failedItems.length} failed to sync`,
        bgColor: 'bg-destructive/10 border-destructive/20 text-destructive',
        dotColor: 'bg-destructive'
      }
    } else {
      return {
        icon: <Clock size={16} />,
        text: `${pendingItems.length} syncing...`,
        bgColor: 'bg-info/10 border-info/20 text-info',
        dotColor: 'bg-info'
      }
    }
  }

  const { icon, text, bgColor } = getStatusConfig()

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-80">
      <div className={`border rounded-lg shadow-lg ${bgColor}`}>
        {/* Main Status Bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span>{text}</span>
          </div>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-border max-h-60 overflow-y-auto">
            <div className="p-3 space-y-2">
              {failedItems.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-destructive uppercase tracking-wide">
                      Failed to Sync
                    </h4>
                    <button
                      onClick={handleRetryAll}
                      disabled={isRetryingAll}
                      className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRetryingAll ? 'Retrying...' : 'Retry All'}
                    </button>
                  </div>
                  {failedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                        <span className="text-muted-foreground">({item.type})</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (item.type === 'project') {
                            retryFailedProject(item.id)
                          } else {
                            retryFailedTodo(item.id, item.projectId!)
                          }
                        }}
                        className="text-primary hover:text-primary/80 ml-2 flex-shrink-0"
                      >
                        Retry
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {pendingItems.length > 0 && (
                <div className="space-y-1">
                  {failedItems.length > 0 && <div className="border-t border-border pt-2 mt-2" />}
                  <h4 className="text-xs font-semibold text-info uppercase tracking-wide">
                    Syncing
                  </h4>
                  {pendingItems.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-info animate-pulse flex-shrink-0" />
                      <span className="truncate flex-1">{item.name}</span>
                      <span className="text-gray-500">({item.type})</span>
                    </div>
                  ))}
                  {pendingItems.length > 5 && (
                    <div className="text-xs text-muted-foreground pl-4">
                      +{pendingItems.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}