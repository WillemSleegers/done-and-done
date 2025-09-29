'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthProvider'
import { Button } from '@/components/ui/button'

export default function ConnectionStatus() {
  const { user, loading } = useAuth()
  const [isOnline, setIsOnline] = useState(true)

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

  // Determine connection state
  const getConnectionState = () => {
    if (!isOnline) return 'offline'
    if (loading) return 'loading'
    if (!user) return 'no-auth'
    return 'connected'
  }

  const connectionState = getConnectionState()

  // Get status config for display
  const getStatusConfig = () => {
    switch (connectionState) {
      case 'offline':
        return {
          color: 'bg-connection-offline',
          label: 'Offline'
        }
      case 'loading':
        return {
          color: 'bg-connection-loading animate-pulse',
          label: 'Loading...'
        }
      case 'no-auth':
        return {
          color: 'bg-connection-no-auth',
          label: 'Not authenticated'
        }
      case 'connected':
        return {
          color: 'bg-connection-connected',
          label: 'Connected'
        }
    }
  }

  const { color, label } = getStatusConfig()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-muted rounded-full"
      title={label}
      tabIndex={4}
    >
      <div className={`w-3 h-3 rounded-full ${color}`} />
    </Button>
  )
}