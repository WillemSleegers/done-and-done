import "./globals.css"

import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import DebugPanel from "@/components/debug/DebugPanel"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { AuthProvider } from "@/lib/AuthProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Done and Done",
  description: "Get things done, and done.",
  // Without this iOS opens the home screen icon in a browser chrome window
  appleWebApp: {
    capable: true,
    title: "Done and Done",
    statusBarStyle: "default",
  },
  // Next emits only the modern mobile-web-app-capable; older iOS reads this one
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#252525" },
  ],
  viewportFit: "cover",
}

export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="h-screen bg-background flex flex-col">{children}</div>
            <DebugPanel />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
