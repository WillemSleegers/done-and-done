"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { siGithub } from "simple-icons"

export default function AuthForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage("Check your email for the magic link!")
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    setGithubLoading(true)
    setMessage("")
    setError("")

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setGithubLoading(false)
    }
  }

  return (
    <div className="h-full bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Done and Done</h1>
          <p className="text-muted-foreground">My first todo app.</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Sign In</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll send you a secure link to sign in.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGithubSignIn}
              className="w-full"
              disabled={githubLoading || loading}
              tabIndex={1}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" role="img">
                <path d={siGithub.path} />
              </svg>
              {githubLoading ? "Signing in..." : "Continue with GitHub"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || githubLoading}
                  className="bg-background"
                  tabIndex={2}
                />
              </div>

              {message && (
                <div className="text-sm text-center p-3 bg-muted/50 text-foreground rounded-lg border">
                  {message}
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={loading || githubLoading}
                tabIndex={3}
              >
                {loading ? "Sending magic link..." : "Send magic link"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
