# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

"Done and Done" is a modern todo management application built with Next.js 16, featuring project organization, priority levels, and real-time sync with Supabase.

## Component Standards

### UI Components

- **Always use Shadcn/ui components** - Button, Input, Dialog, Form, etc.
- **Lucide React icons only** - `import { IconName } from "lucide-react"`
- **Theme colors only** - Use `text-foreground`, `bg-background`, etc. Never hardcode colors

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

- **Propose before implementing** - For significant changes to the codebase, propose the approach and get user approval before proceeding with implementation
- Focus on guidance before implementation
- Implement only when explicitly requested
- **Don't estimate human time constraints** - Avoid mentioning how long tasks "typically take humans" (days/weeks) when analyzing implementation complexity
- **Use TodoWrite tool proactively** - Break complex tasks into trackable steps
- **Responsive design first** - Address mobile issues as they come up, not after

## UI Conventions

- **Stable URLs** - Use UUIDs rather than slugs so renaming does not break navigation
- **Consistent Escape key behavior** - Always revert to the original value when editing began, not the current database value. Store the original in a ref on focus/edit start
- **Keyboard navigation** - Enter saves and blurs, Escape reverts and blurs
- **Disable spellcheck appropriately** - Add `spellCheck={false}` to project names, technical terms, and other inputs where spellcheck creates noise
- **Shadcn component styling** - Override default backgrounds with `dark:bg-transparent`, remove focus rings with `focus-visible:ring-0`
- **Shared loading components** - Use LoadingScreen so auth and data loading do not stack into separate UI jumps

## Problem-Solving

- **Avoid timing-based solutions** - Never use setTimeout/delays to fix race conditions. Find the root cause and fix coordination instead
- **Examine component dependencies** - When replacing HTML elements with shadcn components, check the component source for default classes that need overriding
- **Question the approach** - If a solution feels like overkill, step back and consider simpler alternatives (refs vs state, one ref vs several)
