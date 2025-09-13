# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Done and Done" is a modern project and todo management application built with Next.js 15. 

**Core Features:**
- **Project Management** - Create and organize projects with descriptions
- **Todo Lists** - Add, complete, and delete todos within projects  
- **Progress Tracking** - Visual progress indicators showing completion status
- **User Authentication** - Secure login via email/password, magic links, or social providers (Google, GitHub)
- **Real-time Sync** - Seamless data synchronization with Supabase backend
- **Mobile-First Design** - Responsive interface optimized for phone and desktop use
- **Dark/Light Theme** - System-aware theme switching

**Technical Stack:**
- Next.js 15 with App Router architecture
- React 19 with TypeScript 5
- Supabase for backend, database, and authentication
- Tailwind CSS v4 with TailwindCSS PostCSS
- Shadcn/ui components (configured with "new-york" style)

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle with Turbopack  
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Architecture & Key Files

### App Structure
- `app/` - Next.js App Router pages and layouts
- `app/layout.tsx` - Root layout with Geist fonts
- `app/page.tsx` - Home page component
- `app/globals.css` - Global Tailwind CSS styles

### Component Architecture
- `components/` - Organized component library:
  - `components/ui/` - UI components (ModeToggle, ThemeProvider, UserMenu)
  - `components/project/` - Project-related components (ProjectGrid, ProjectTodoView, NewProjectModal)  
  - `components/system/` - System components (SyncStatus)
  - `components/auth/` - Authentication components (AuthForm, AuthGuard)
- `components.json` - Shadcn/ui configuration
- `lib/utils.ts` - Utility functions including `cn()` for className merging
- `lib/supabase.ts` - Supabase client configuration and types
- `lib/DataProvider.tsx` - Global data state management
- `lib/AuthProvider.tsx` - Authentication state management
- Path aliases configured: `@/*` maps to project root

### Styling
- Uses Tailwind CSS v4 with CSS variables
- Shadcn/ui components with "new-york" style
- Lucide React icons
- Custom utilities via `class-variance-authority`, `clsx`, and `tailwind-merge`

### TypeScript Configuration
- Target: ES2017
- Strict mode enabled
- Path mapping: `@/*` for imports
- Next.js plugin configured

## Key Dependencies
- Next.js 15.5.2 with Turbopack support
- React 19 
- Tailwind CSS v4
- Supabase (@supabase/supabase-js, @supabase/auth-ui-react)
- Shadcn/ui component system
- Lucide React for icons
- Next Themes for theme switching

## UX Philosophy
- **Minimal Clicks** - Optimize for efficiency by minimizing the number of clicks required for common actions
- **One-Click Actions** - Most frequent operations (adding todos, completing tasks, creating projects) should require only a single click
- **Confirmation for Destructive Actions** - Only require additional confirmation steps for potentially dangerous operations like deleting projects
- **Invisible Sync** - All data synchronization should happen seamlessly in the background
- **Optimistic Updates** - UI should respond immediately to user actions, with background sync
- **Minimal Error Exposure** - Only show sync status/errors when something actually fails
- **No Sync Spinners** - Avoid loading indicators for sync operations that should "just work"
- **Graceful Degradation** - App should work offline and sync when connection is restored

## Component Standards
- **Use shadcn/ui components** - Always prefer shadcn/ui components over custom HTML elements
- **Consistent Design System** - Button, Input, Dialog, DropdownMenu, etc. should use shadcn variants
- **No Custom UI Elements** - Avoid custom buttons, inputs, modals, or form elements
- **Install Missing Components** - Add new shadcn components as needed rather than building custom alternatives

## Code Architecture Principles
- **Single Return Pattern** - Prefer single return statements with conditional rendering over multiple returns with duplicate wrapper elements
- **Question Structure First** - When fixing "duplicate code", always step back and consider if the entire component structure could be improved
- **Avoid Structural Duplication** - Look for duplicate wrapper divs, headers, or layout elements that indicate poor component organization
- **Consider Alternatives** - Before implementing the first working solution, explore if there's a cleaner architectural approach
- **React Best Practices** - Use conditional rendering within JSX rather than early returns when possible

## Communication Style
- **No excessive praise** - Avoid calling obvious solutions "brilliant" or over-praising user suggestions
- **Be direct and honest** - Don't sugarcoat feedback or overly compliment basic ideas
- **Focus on the work** - Keep responses focused on the technical task rather than flattery

## Development Approach
- **Run dev server during development** - Start `npm run dev` when working on code so user can preview changes live
- Focus on answering questions and providing guidance before implementing
- Only implement solutions when explicitly requested by the user
- Avoid jumping immediately into code changes or setup

## Data Consistency Requirements
- **Database Schema First** - When adding new fields to Project or Todo types, ALWAYS instruct the user to add the corresponding columns to Supabase database first
- **Sync Service Alignment** - Ensure all type definitions in sync service match the database schema and include all fields that need to be persisted
- **Full Stack Changes** - Any data model changes must be implemented across: Database → Sync Service Types → Store → UI Components
- **No Partial Implementations** - Never add fields to types that aren't properly synced to the database, as this creates data loss on refresh