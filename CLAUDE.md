# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

"Done and Done" is a modern todo management application built with Next.js 15, featuring project organization, priority levels, and real-time sync with Supabase.

**Technical Stack:**
- Next.js 15 with App Router + React 19 + TypeScript
- Shadcn/ui components (new-york style) + Tailwind CSS v4
- Supabase (backend, database, auth) + Zustand (state management)

## Environment Setup

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint

### Development Server Management
- **Always use port 3000** - Kill existing processes: `kill -9 $(lsof -ti:3000)`
- **Single dev server** - Only run one at a time to avoid conflicts

## Component Standards

### UI Components
- **Always use Shadcn/ui components** - Button, Input, Dialog, Form, etc.
- **Lucide React icons only** - `import { IconName } from "lucide-react"`
- **Theme colors only** - Use `text-foreground`, `bg-background`, etc. Never hardcode colors

### Project-Specific Patterns
- **Priority System** - `bg-priority-high/normal/low` for visual hierarchy
- **Status States** - Active (full opacity), Inactive (25% opacity), Complete (25% opacity, no counts)
- **Optimistic Updates** - UI responds immediately, syncs in background

## UX Philosophy
- **One-click actions** - Minimize clicks for common operations
- **Maximum smoothness** - Eliminate loading states, delays, UI flashes
- **Invisible sync** - Background synchronization, only show errors when failed

## Data Architecture
- **Database schema first** - Always update Supabase before adding fields to types
- **Full-stack consistency** - Changes must flow: Database → Sync Service → Store → UI
- **Type safety** - Use generated Supabase types throughout

## Development Approach
- Start `npm run dev` when working on code for live preview
- Focus on guidance before implementation
- Implement only when explicitly requested