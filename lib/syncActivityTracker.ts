// Session sync activity tracker
export interface SyncActivity {
  id: string
  name: string
  type: 'project' | 'todo'
  action: 'added' | 'updated' | 'deleted' | 'completed' | 'uncompleted'
  projectName?: string
  timestamp: number
}

class SyncActivityTracker {
  private activities: SyncActivity[] = []
  private listeners: Set<() => void> = new Set()

  addActivity(activity: Omit<SyncActivity, 'timestamp'>) {
    this.activities.unshift({
      ...activity,
      timestamp: Date.now()
    })

    // Keep only last 20 activities
    if (this.activities.length > 20) {
      this.activities = this.activities.slice(0, 20)
    }

    this.notifyListeners()
  }

  getRecentActivities(limit: number = 5): SyncActivity[] {
    return this.activities.slice(0, limit)
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  clear() {
    this.activities = []
    this.notifyListeners()
  }
}

// Global instance
export const syncActivityTracker = new SyncActivityTracker()