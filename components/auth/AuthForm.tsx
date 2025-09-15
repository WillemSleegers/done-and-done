"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/layout/ModeToggle"
import { Github } from "lucide-react"

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
        provider: 'github',
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Done and Done
          </h1>
          <p className="text-muted-foreground">My first todo app.</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Sign In
            </h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll send you a secure link to sign in.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGithubSignIn}
              variant="outline"
              className="w-full"
              disabled={githubLoading || loading}
            >
              <Github className="mr-2 h-4 w-4" />
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
                <label htmlFor="email" className="text-sm font-medium">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || githubLoading}
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

              <Button type="submit" className="w-full" disabled={loading || githubLoading}>
                {loading ? "Sending magic link..." : "Send magic link"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
