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

## Development Approach
- Focus on answering questions and providing guidance before implementing
- Only implement solutions when explicitly requested by the user
- Avoid jumping immediately into code changes or setup