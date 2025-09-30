"use client"

import { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"

import { supabase } from "./supabase"

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
      console.warn(
        "Supabase environment variables not configured. Authentication will not work."
      )
      setLoading(false)
      return
    }

    // Get initial session immediately
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const newUser = session?.user ?? null
      setUser(newUser)
      setLoading(false)
      console.log("Initial auth state:", newUser?.email || 'unauthenticated')
    }

    getInitialSession()

    // Add timeout fallback for auth state detection
    const authTimeout = setTimeout(async () => {
      console.warn('[AUTH] Auth state detection timeout - clearing session and forcing fresh login')
      // Clear any stuck session data
      await supabase.auth.signOut({ scope: 'local' })
      setUser(null)
      setLoading(false)
    }, 15000) // 15 second timeout for auth

    // Handle auth state changes (including initial session)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
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
        console.log('[AUTH] User authenticated, auth loading complete')
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
      console.error("Error signing out:", error)
    }
  }

  const value = {
    user,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
