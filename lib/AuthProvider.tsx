"use client"

import { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"

import { supabase } from "./supabase"
import { logger } from "./logger"
import { SYNC_TIMING } from "./constants"

type AuthContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    // Check if Supabase is properly configured
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      logger.warn(
        "Supabase environment variables not configured. Authentication will not work."
      )
      setLoading(false)
      return
    }

    // Get initial session immediately
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          logger.auth('Session error, clearing local session:', error.message)
          await supabase.auth.signOut({ scope: 'local' })
          setUser(null)
          setLoading(false)
          return
        }

        const newUser = session?.user ?? null
        setUser(newUser)
        setLoading(false)
        logger.auth("Initial auth state:", newUser?.email || 'unauthenticated')
      } catch (error) {
        logger.error('Failed to get initial session:', error)
        await supabase.auth.signOut({ scope: 'local' })
        setUser(null)
        setLoading(false)
      }
    }

    getInitialSession()

    // Add timeout fallback for auth state detection
    const authTimeout = setTimeout(async () => {
      logger.warn('Auth state detection timeout - clearing session and forcing fresh login')
      // Clear any stuck session data
      await supabase.auth.signOut({ scope: 'local' })
      setUser(null)
      setLoading(false)
    }, SYNC_TIMING.AUTH_TIMEOUT)

    // Handle auth state changes (including initial session)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.auth("Auth state changed:", { event, email: session?.user?.email })
      clearTimeout(authTimeout) // Clear timeout since auth state resolved

      const newUser = session?.user ?? null
      setUser(newUser)

      // Don't show loading for token refresh events
      if (event === 'TOKEN_REFRESHED') {
        return
      }

      if (newUser) {
        // Don't wait for data fetching in auth provider - let components handle it
        // This prevents auth from hanging if data sync fails
        logger.auth('User authenticated, auth loading complete')
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(authTimeout)
    }
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      logger.error("Error signing out:", error)
    }
  }

  const value = {
    user,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
