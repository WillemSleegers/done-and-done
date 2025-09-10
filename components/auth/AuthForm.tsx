'use client'

import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useTheme } from 'next-themes'

export default function AuthForm() {
  const { theme } = useTheme()
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Done and Done</h1>
          <p className="text-muted-foreground">Sign in to manage your projects</p>
        </div>
        
        <div className="bg-card rounded-lg shadow-lg border border-border p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                    brandButtonText: 'hsl(var(--primary-foreground))',
                    defaultButtonBackground: 'hsl(var(--background))',
                    defaultButtonBackgroundHover: 'hsl(var(--muted))',
                    defaultButtonBorder: 'hsl(var(--border))',
                    defaultButtonText: 'hsl(var(--foreground))',
                    dividerBackground: 'hsl(var(--border))',
                    inputBackground: 'hsl(var(--background))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--ring))',
                    inputBorderFocus: 'hsl(var(--ring))',
                    inputText: 'hsl(var(--foreground))',
                    inputLabelText: 'hsl(var(--foreground))',
                    inputPlaceholder: 'hsl(var(--muted-foreground))',
                    messageText: 'hsl(var(--foreground))',
                    messageTextDanger: 'hsl(var(--destructive))',
                    anchorTextColor: 'hsl(var(--primary))',
                    anchorTextHoverColor: 'hsl(var(--primary))',
                  },
                },
              },
              className: {
                container: 'space-y-4',
                button: 'rounded-lg font-medium transition-all duration-200',
                input: 'rounded-lg',
                label: 'text-sm font-medium',
                message: 'text-sm',
              },
            }}
            theme={theme === 'dark' ? 'dark' : 'light'}
            providers={['google', 'github']}
            redirectTo={`${origin}/auth/callback`}
            onlyThirdPartyProviders={false}
            magicLink={true}
            showLinks={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email address',
                  password_label: 'Password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in ...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: "Don't have an account? Sign up",
                },
                sign_up: {
                  email_label: 'Email address',
                  password_label: 'Password', 
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign up',
                  loading_button_label: 'Signing up ...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                },
                magic_link: {
                  email_input_label: 'Email address',
                  email_input_placeholder: 'Your email address',
                  button_label: 'Send magic link',
                  loading_button_label: 'Sending magic link ...',
                  link_text: 'Send a magic link email',
                },
              },
            }}
          />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our terms and privacy policy
          </p>
        </div>
      </div>
    </div>
  )
}