# TODO

## Critical Issues (Fix First)

- **Convert to true single-page app (remove Next.js routing)**
  - Currently using `router.push()` which causes inconsistent navigation delays (200-500ms)
  - Remove router logic from `app/page.tsx` and manage `selectedProject` with React state
  - Navigation should be instant state updates: `setSelectedProject(project)` or `setSelectedProject(null)`
  - Optionally use `window.history.pushState()` to update URL without triggering navigation (for bookmarks/back button)
  - Benefits: Instant navigation, predictable performance, simpler code
  - Trade-off: Lose native URL-based navigation unless we implement custom history handling

- **~~Remove production console.log statements (60+ instances)~~** ✅ COMPLETED
  - Created logger utility that only shows errors in production
  - Replaced all console statements across codebase

- **Add error boundaries to prevent app crashes**
  - Create `app/error.tsx` for page-level errors
  - Create `components/ErrorBoundary.tsx` for reusable boundaries
  - Wrap critical sections (AuthGuard, ProjectTodoView, etc.)

- **~~Fix `h-22` typo in ProjectTile:180~~** ✅ COMPLETED
  - Fixed to `h-20`

## Important Issues (Address Soon)

- **Type catch blocks properly**
  - Components/project/ProjectTodoView.tsx (lines 82, 132, 206, 208)
  - Components/project/TodoItem.tsx (lines 98, 146, 163)
  - Components/project/AddTodoForm.tsx (lines 68, 71)
  - Add proper error typing instead of empty catches

- **Extract duplicate logic**
  - Create `<PriorityBadge priority={project.priority} />` component
  - Priority dot logic duplicated in ProjectTile and ProjectHeader
  - Create `useSyncItems()` hook for sync state calculation
  - Logic duplicated in ConnectionStatus and SyncStatus

- **Split large files**
  - Split `syncService.ts` (482 lines) into:
    - `syncClient.ts` (API calls)
    - `syncRetry.ts` (retry logic)
    - `syncOrchestrator.ts` (coordination)
  - Split `projectStore.ts` (464 lines) into slices:
    - `projectSlice.ts`
    - `todoSlice.ts`
  - Consider extracting hooks from `TodoItem.tsx` (397 lines):
    - `useTodoEdit()` hook
    - `useTodoDragDrop()` hook

- **Create unified error handling system**
  - Implement toast/notification system
  - Replace console-only errors with user feedback
  - Standardize error message patterns across components

## Minor Polish Items

- **Standardize quote usage**
  - Mixed single and double quotes throughout codebase
  - Configure ESLint/Prettier to enforce consistent style (recommend single quotes)

- **Remove dead code**
  - `createSlug()` function in `/lib/utils.ts` (lines 8-15)
  - `getProjectBySlug()` function - never called after UUID-based URL switch

- **Extract magic numbers to constants file**
  - Create `lib/constants.ts` with:
    - `TOUCH_DELAYS` (200ms, 150ms variations)
    - `SYNC_TIMING` (10s base, 60s max retry)
    - `DISPLAY_LIMITS` (activity count, completed todos shown)

- **Create reusable Spinner component**
  - 3 different loading spinner implementations found:
    - LoadingScreen: 4px border, border-t-transparent
    - AuthPage: 2px border, border-b-transparent
    - AddTodoForm: 2px border, border-t-transparent
  - Standardize with size variants (sm, md, lg)

- **Standardize import ordering**
  - Establish consistent order:
    1. External libraries (React, Next.js)
    2. Type imports
    3. Internal lib imports
    4. Component imports
    5. Utility imports
    6. Style imports

- **Add performance optimizations**
  - Add `useMemo` for sorted lists in ProjectGrid
  - Consider `React.memo` for ProjectTile and TodoItem
  - Debounce activity tracker updates in ConnectionStatus
  - Memoize expensive computations in `getProjectTodos`

- **Standardize button heights**
  - Document height standards (h-9 for compact, h-10/40px for standard)
  - Currently mixed: h-8, h-9, h-10, h-14, min-h-[40px], h-20

## UI/UX

- Improve colors
  - Add nice vibrant colors for tiles (project tiles, todo items)

## Code Quality

- **Standardize component patterns**
  - Consistent prop interfaces and naming conventions
  - Standardize loading states and error handling patterns

## Developer Experience

- **Accessibility**
  - Improve keyboard navigation

## Security Considerations

- **Environment variable handling**
  - Add runtime validation for required env vars in production
  - Remove placeholder fallbacks that mask missing configuration

- **Input sanitization**
  - Consider input length limits for project names
  - Add XSS protection for rendered content

## Misc.

- Explain to me the differences between a single-page app approach and one using a separate pages architecture
