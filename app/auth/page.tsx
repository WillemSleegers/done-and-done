'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthProvider'
import AuthForm from '@/components/auth/AuthForm'

export default function AuthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  // If user is authenticated, redirect (no loading screen needed)
  if (user) {
    return null // Will redirect to home page
  }

  // Always show auth form immediately - no loading screen for unauthenticated users
  return <AuthForm />
}