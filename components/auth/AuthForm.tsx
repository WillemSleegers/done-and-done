"use client"

import { useState, useEffect } from "react"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/lib/supabase"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

type AuthView = "sign_in" | "sign_up" | "magic_link"

export default function AuthForm() {
  const { theme } = useTheme()
  const [origin, setOrigin] = useState("")
  const [view, setView] = useState<AuthView>("magic_link")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Done and Done
          </h1>
          <p className="text-muted-foreground">My first todo app.</p>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {view === "sign_in" && "Sign In"}
            {view === "sign_up" && "Create Account"}
            {view === "magic_link" && "Magic Link"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {view === "sign_in" && "Welcome back! Please sign in to your account."}
            {view === "sign_up" && "Create a new account to get started."}
            {view === "magic_link" && "We'll send you a secure link to sign in."}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-lg border border-border p-6">
          <Auth
            supabaseClient={supabase}
            view={view}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "hsl(var(--primary))",
                    brandAccent: "hsl(var(--primary))",
                    brandButtonText: "hsl(var(--primary-foreground))",
                    defaultButtonBackground: "hsl(var(--background))",
                    defaultButtonBackgroundHover: "hsl(var(--muted))",
                    defaultButtonBorder: "hsl(var(--border))",
                    defaultButtonText: "hsl(var(--foreground))",
                    dividerBackground: "hsl(var(--border))",
                    inputBackground: "hsl(var(--background))",
                    inputBorder: "hsl(var(--border))",
                    inputBorderHover: "hsl(var(--ring))",
                    inputBorderFocus: "hsl(var(--ring))",
                    inputText: "hsl(var(--foreground))",
                    inputLabelText: "hsl(var(--foreground))",
                    inputPlaceholder: "hsl(var(--muted-foreground))",
                    messageText: "hsl(var(--foreground))",
                    messageTextDanger: "hsl(var(--destructive))",
                    anchorTextColor: "hsl(var(--primary))",
                    anchorTextHoverColor: "hsl(var(--primary))",
                  },
                },
              },
              className: {
                container: "space-y-4",
                button: "rounded-lg font-medium transition-all duration-200",
                input: "rounded-lg",
                label: "text-sm font-medium",
                message: "text-sm",
              },
            }}
            theme={theme === "dark" ? "dark" : "light"}
            redirectTo={`${origin}/auth/callback`}
            onlyThirdPartyProviders={false}
            providers={[]}
            magicLink={true}
            showLinks={false}
            localization={{
              variables: {
                sign_in: {
                  email_label: "Email address",
                  password_label: "Password",
                  email_input_placeholder: "Your email address",
                  password_input_placeholder: "Your password",
                  button_label: "Sign in",
                  loading_button_label: "Signing in ...",
                  social_provider_text: "Sign in with {{provider}}",
                  link_text: "Don't have an account? Sign up",
                },
                sign_up: {
                  email_label: "Email address",
                  password_label: "Password",
                  email_input_placeholder: "Your email address",
                  password_input_placeholder: "Your password",
                  button_label: "Sign up",
                  loading_button_label: "Signing up ...",
                  social_provider_text: "Sign up with {{provider}}",
                  link_text: "Already have an account? Sign in",
                },
                magic_link: {
                  email_input_label: "Email address",
                  email_input_placeholder: "Your email address",
                  button_label: "Send magic link",
                  loading_button_label: "Sending magic link ...",
                  link_text: "Send a magic link email",
                },
              },
            }}
          />

          <div className="mt-6 space-y-3">
            {view === "sign_in" && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setView("sign_up")}
                  className="w-full"
                >
                  Don&apos;t have an account? Create one
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setView("magic_link")}
                  className="w-full text-sm"
                >
                  Send me a magic link instead
                </Button>
              </div>
            )}

            {view === "sign_up" && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setView("sign_in")}
                  className="w-full"
                >
                  Already have an account? Sign in
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setView("magic_link")}
                  className="w-full text-sm"
                >
                  Send me a magic link instead
                </Button>
              </div>
            )}

            {view === "magic_link" && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => setView("sign_in")}
                  className="w-full text-sm"
                >
                  Use password instead
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
