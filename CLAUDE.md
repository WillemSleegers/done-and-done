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
- **Ask clarifying questions first** - When requirements are ambiguous (e.g., "40px height" - total height or content height?), ask for clarification before implementing to avoid back-and-forth iterations

## Productive Refactoring Sessions

### Planning & Communication
- **Use TodoWrite tool proactively** - Break complex tasks into trackable steps
- **Examine before refactoring** - Always read and understand existing code first
- **Discuss layout changes** - Get user feedback on UI/UX decisions before implementing
- **Iterative refinement** - Make changes, get feedback, refine (status/priority order, button placement, etc.)

### Component Architecture
- **Component breakdown strategy** - Split large components (647→270 lines) into focused pieces
- **Consistent height standards** - Standardize UI element heights (40px) across components
- **Responsive design first** - Address mobile issues during refactoring, not after
- **Actions placement** - Group related controls logically (priority/status/actions together)

### Implementation Best Practices
- **Import cleanup** - Remove unused imports to fix build warnings
- **TypeScript prop matching** - Ensure interface props match component usage
- **Maintain functionality** - Preserve all existing features during restructure
- **Test as you go** - Keep dev server running, fix issues immediately

### Commit Strategy
- **Comprehensive commits** - Include all related changes in single semantic commit
- **Descriptive messages** - Explain what was refactored and why
- **Fix builds immediately** - Address ESLint/TypeScript issues in follow-up commit
- **Document benefits** - Highlight improvements (60% code reduction, better mobile UX, etc.)