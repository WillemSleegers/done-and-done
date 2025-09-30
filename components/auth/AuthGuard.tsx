"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import LoadingScreen from "@/components/layout/LoadingScreen"
import { useAuth } from "@/lib/AuthProvider"
import { logger } from "@/lib/logger"
import { useProjectStore } from "@/lib/store/projectStore"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { fetchInitialData, isLoading } = useProjectStore()

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  // Fetch initial data when user is authenticated
  useEffect(() => {
    if (!loading && user) {
      logger.auth("User authenticated, fetching initial data")
      fetchInitialData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  // Show loading for auth OR data loading
  if (loading || (user && isLoading)) {
    return fallback || <LoadingScreen />
  }

  if (!user) {
    return fallback || <LoadingScreen /> // Show loading while redirecting
  }

  return <>{children}</>
}
