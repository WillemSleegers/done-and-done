'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback using exchangeCodeForSession for OAuth flows
        const code = searchParams.get('code')
        
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Auth callback error:', error)
            router.push('/auth?error=callback_error')
            return
          }
        }

        // Check if we have a session after the callback
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          router.push('/')
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        router.push('/auth?error=unexpected')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}