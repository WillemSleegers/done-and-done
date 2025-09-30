'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('Auth callback error:', error)
            router.push('/auth?error=callback_error')
            return
          }
        }

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

  return <LoadingScreen />
}