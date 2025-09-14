# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Done and Done" is a modern project and todo management application built with Next.js 15. 

**Core Features:**
- **Project Management** - Create and organize projects with descriptions, priority levels, and status tracking
- **Priority System** - Three-tier priority system (high/normal/low) with visual color coding
- **Project Status** - Active, inactive, and complete project states with appropriate visual treatment
- **Todo Lists** - Add, complete, and delete todos within projects  
- **Progress Tracking** - Visual progress indicators showing completion status
- **User Authentication** - Secure login via email/password, magic links, or social providers (Google, GitHub)
- **Real-time Sync** - Seamless data synchronization with Supabase backend
- **Optimistic Updates** - Immediate UI responses with background synchronization
- **Mobile-First Design** - Responsive interface optimized for phone and desktop use
- **Dark/Light Theme** - System-aware theme switching

**Technical Stack:**
- Next.js 15 with App Router architecture
- React 19 with TypeScript 5
- **Shadcn/ui component system** (configured with "new-york" style) - **Primary UI framework**
- Tailwind CSS v4 with CSS variables and TailwindCSS PostCSS
- Supabase for backend, database, and authentication
- Zustand for client-side state management

## Environment Setup

### Required Environment Variables
Create a `.env.local` file in the project root with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** You'll need to create these environment variables when setting up the app on a new computer. The app will show a "Missing Supabase environment variables" warning without them.

### Supabase Setup
1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from Settings > API
3. Set up the database schema (tables: `projects`, `todos`)
4. Configure authentication providers if needed

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
  - `components/ui/` - Shadcn/ui components (Button, Dialog, Input, etc.)
  - `components/layout/` - Layout components (ModeToggle, ThemeProvider)
  - `components/navigation/` - Navigation components (UserMenu)
  - `components/project/` - Project-related components (ProjectGrid, ProjectTile, ProjectTodoView)  
  - `components/system/` - System components (SyncStatus, DataInitializer)
  - `components/auth/` - Authentication components (AuthForm, AuthGuard)
- `components.json` - Shadcn/ui configuration

### State Management & Data Layer
- `lib/store/projectStore.ts` - Zustand-based global state management for projects and todos
- `lib/services/syncService.ts` - Handles data synchronization with Supabase backend
- `lib/hooks/useInitializeData.ts` - Custom hook for data initialization
- `lib/supabase.ts` - Supabase client configuration and types
- `lib/database.types.ts` - TypeScript types generated from Supabase schema
- `lib/AuthProvider.tsx` - Authentication state management
- `lib/utils.ts` - Utility functions including `cn()` for className merging
- Path aliases configured: `@/*` maps to project root

### Styling
- Uses Tailwind CSS v4 with CSS variables
- Shadcn/ui components with "new-york" style
- Lucide React icons
- Custom utilities via `class-variance-authority`, `clsx`, and `tailwind-merge`

### Theme Colors
- **Always use theme colors** - Never hardcode colors like `text-green-600` or `bg-red-100`
- **Use CSS variables** - `text-foreground`, `bg-background`, `border-border`, etc.
- **Semantic color tokens** - `text-destructive`, `bg-muted`, `border-destructive/20`
- **Available theme colors**: `background`, `foreground`, `card`, `muted`, `muted-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `destructive`, `destructive-foreground`, `border`, `ring`

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
- Zustand 5.0.8 for state management
- Shadcn/ui component system (@radix-ui components)
- Lucide React for icons
- Next Themes for theme switching
- Class Variance Authority & Tailwind Merge for styling utilities

## Project System Architecture

### Priority Levels
- **High Priority** - Red-tinted background (`bg-priority-high`)
- **Normal Priority** - Default blue-tinted background (`bg-priority-normal`) 
- **Low Priority** - Muted gray background (`bg-priority-low`)
- Priority affects visual prominence and tile styling

### Project Status States
- **Active** - Full opacity, normal interaction, shows todo counts
- **Inactive** - Reduced opacity (25%), hover to show (90%), muted text, shows todo counts
- **Complete** - Reduced opacity (25%), muted text, hides todo counts, grouped separately

### Data Flow Architecture
1. **UI Layer** - Components make optimistic updates to Zustand store
2. **State Layer** - Zustand store manages local state and triggers sync
3. **Sync Layer** - Background service handles Supabase synchronization
4. **Database Layer** - Supabase provides persistence and real-time updates

## UX Philosophy
- **Minimal Clicks** - Optimize for efficiency by minimizing the number of clicks required for common actions
- **One-Click Actions** - Most frequent operations (adding todos, completing tasks, creating projects) should require only a single click
- **Confirmation for Destructive Actions** - Only require additional confirmation steps for potentially dangerous operations like deleting projects
- **Invisible Sync** - All data synchronization should happen seamlessly in the background
- **Optimistic Updates** - UI should respond immediately to user actions, with background sync
- **Minimal Error Exposure** - Only show sync status/errors when something actually fails
- **No Sync Spinners** - Avoid loading indicators for sync operations that should "just work"
- **Graceful Degradation** - App should work offline and sync when connection is restored
- **CRITICAL: Maximum Smoothness** - The app must feel as smooth as possible. Eliminate ALL unnecessary loading states, delays, and UI flashes. Navigation between pages should be instant since all data is pre-loaded. This is a top priority - any loading delays or UI jank significantly degrades the user experience.

## Component Standards

### Shadcn/ui Components First
- **Default Choice** - Always use shadcn/ui components unless there is a compelling technical reason not to
- **Avoid Custom UI Elements** - Use shadcn components instead of building custom buttons, inputs, modals, forms, dropdowns, dialogs
- **Install Before Building** - If a shadcn component doesn't exist, check if it's available to install via `npx shadcn@latest add <component>`
- **Extend, Don't Replace** - If customization is needed, extend shadcn components using their built-in variant system or composition patterns

### Component Usage Guidelines
- **Button** - Always use `<Button variant="..." size="...">` instead of `<button>`
- **Input** - Always use `<Input>` instead of `<input>`
- **Dialog/Modal** - Always use `<Dialog>`, `<DialogContent>`, `<DialogHeader>` etc.
- **Forms** - Use `<Form>`, `<FormField>`, `<FormItem>` components for all form layouts
- **Navigation** - Use `<DropdownMenu>` for menus, `<NavigationMenu>` for nav bars
- **Data Display** - Use `<Card>`, `<Badge>`, `<Table>` for content presentation

### When Custom Components Are Acceptable
- **Business Logic Components** - App-specific components like `ProjectTile`, `TodoList` that compose shadcn primitives
- **Layout Components** - Containers and layout helpers that don't replace interactive elements
- **Integration Wrappers** - Components that wrap third-party libraries (charts, editors) with shadcn styling

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

## Current Implementation Patterns

- **Optimistic UI Updates** - All user actions update the UI immediately, then sync in background
- **Error Recovery** - Failed syncs revert UI state and provide retry mechanisms
- **Priority-First Design** - Project tiles use priority for visual hierarchy (high → normal → low)
- **Status-Based Sorting** - Projects sorted by status (active → inactive → complete) then by creation date
- **Zustand Store Architecture** - Single store manages all projects, todos, and derived state (counts, loading)
- **Component Composition** - Prefer composition over prop drilling, use context sparingly
- **Type Safety** - All database operations use generated TypeScript types from Supabase
