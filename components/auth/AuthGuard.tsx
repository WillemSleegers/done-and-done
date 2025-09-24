'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthProvider'
import LoadingScreen from '@/components/ui/LoadingScreen'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen bg-background">
          <div className="pt-6">
            <LoadingScreen />
          </div>
        </div>
      )
    )
  }

  if (!user) {
    return null // Will redirect to auth page
  }

  return <>{children}</>
}