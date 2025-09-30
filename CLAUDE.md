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

## Code Style
- **Minimal comments** - Avoid verbose or redundant comments on legacy code
- **Self-documenting code** - Prefer clear naming and structure over explanatory comments
- **Only comment when useful** - Add comments only when requested or for complex business logic

## Data Architecture
- **Database schema first** - Always update Supabase before adding fields to types
- **Full-stack consistency** - Changes must flow: Database → Sync Service → Store → UI
- **Type safety** - Use generated Supabase types throughout

## Development Approach
- **ALWAYS start dev server first** - Run `npm run dev` at the beginning of ANY coding session, even for simple fixes
- Start `npm run dev` when working on code for live preview
- **Propose before implementing** - For significant changes to the codebase, propose the approach and get user approval before proceeding with implementation
- Focus on guidance before implementation
- Implement only when explicitly requested
- **Ask clarifying questions first** - When requirements are ambiguous (e.g., "40px height" - total height or content height?), ask for clarification before implementing to avoid back-and-forth iterations
- **Don't estimate human time constraints** - Avoid mentioning how long tasks "typically take humans" (days/weeks) when analyzing implementation complexity

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

### React Best Practices
- **Avoid useEffect dependency loops** - Never include state variables in useEffect dependencies when the effect modifies that same state (causes infinite loops)
- **Check dependency arrays carefully** - Ensure useEffect dependencies are minimal and correct
- **State management patterns** - Follow established patterns for state updates and side effects
- **Use refs for non-reactive values** - When storing values that don't need to trigger re-renders (like "original value" for Escape key behavior), use useRef instead of useState
- **Coordinate loading states** - Prevent duplicate loading screens by coordinating auth/data loading states rather than showing multiple sequential loaders

### UI/UX Patterns
- **Shared loading components** - Create consistent LoadingScreen components to prevent UI jumps between different loading states
- **Stable URLs** - Use UUIDs for URLs rather than slugs to prevent navigation issues when names change (URLs like `/?project=uuid` vs `/?project=name-slug`)
- **Consistent Escape key behavior** - Always revert to original value when editing began, not current database value. Store original in ref on focus/edit start
- **Disable spellcheck appropriately** - Add `spellCheck={false}` to project names, technical terms, and other inputs where spellcheck creates noise
- **Keyboard navigation** - Ensure Enter saves and blurs input, Escape reverts and blurs input for consistent editing UX
- **Shadcn component styling** - Override default backgrounds with `dark:bg-transparent`, remove focus rings with `focus-visible:ring-0`, and maintain visual consistency while using components

### Communication Best Practices
- **Be honest about knowledge limits** - Never claim to have read documentation or sources you don't have access to
- **Don't fabricate documentation references** - If suggesting approaches, be clear they're general practices, not specific recommendations from docs
- **Admit uncertainty** - Say "I'm not sure" rather than making confident claims without evidence
- **Distinguish between facts and assumptions** - Be explicit when making educated guesses vs stating known facts

### Problem-Solving Approach
- **Avoid timing-based solutions** - Never use setTimeout/delays to fix race conditions. Find the root cause and fix coordination instead
- **Examine component dependencies** - When replacing HTML elements with shadcn components, check the component source to understand default classes that need overriding
- **Simplify complex state** - When managing "original values" or backup data, prefer refs over state to avoid unnecessary complexity and re-renders
- **Question the approach** - If a solution feels like "overkill", step back and consider simpler alternatives (useEffect vs refs, multiple states vs single ref)

### Continuous Improvement
- **Proactively suggest CLAUDE.md updates** - When encountering mistakes, identifying better approaches, or learning new patterns, suggest adding them to CLAUDE.md to prevent future issues
- **Document lessons learned** - Turn mistakes and discoveries into permanent guidance

### Commit Strategy
- **Comprehensive commits** - Include all related changes in single semantic commit
- **Descriptive messages** - Explain what was refactored and why
- **Fix builds immediately** - Address ESLint/TypeScript issues in follow-up commit
- **Document benefits** - Highlight improvements (60% code reduction, better mobile UX, etc.)