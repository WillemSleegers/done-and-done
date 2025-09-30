# TODO

## Critical Issues (Fix First)

- **~~Convert to true single-page app (remove Next.js routing)~~** ✅ COMPLETED
  - Replaced router.push() with React state management
  - Using window.history.pushState() for URL updates without navigation
  - Instant navigation with setSelectedProject() state updates
  - No more navigation delays

- **~~Remove production console.log statements (60+ instances)~~** ✅ COMPLETED
  - Created logger utility that only shows errors in production
  - Replaced all console statements across codebase

- **~~Add error boundaries to prevent app crashes~~** ✅ COMPLETED
  - Created `app/error.tsx` for page-level errors
  - Created `components/ErrorBoundary.tsx` for reusable boundaries

- **~~Fix `h-22` typo in ProjectTile:180~~** ✅ COMPLETED
  - Fixed to `h-20`

- **~~Add project deletion to sync status component~~** ✅ COMPLETED
  - Added activity tracker call in projectStore.ts deleteProject function

- **~~Fix bug that deleting todo items completes them~~** ✅ COMPLETED
  - Added touch event handlers (onTouchStart, onTouchEnd) with stopPropagation to dropdown menu items
  - Prevents touch events from bubbling to parent todo row and triggering completion

- **~~Fix bug that on the phone added todos disappear after locking the screen~~** ✅ COMPLETED
  - Fixed AuthGuard to only re-fetch data on user/loading changes, not on every render
  - Updated fetchInitialData to merge local/syncing items with fetched data instead of replacing them
  - Preserves unsaved todos when app returns from background

- **~~Reduce accidental completion of todos by making the todo dropdown button larger~~** ✅ COMPLETED
  - Increased dropdown button from 26px to 36px (size-9)
  - Increased icon size from 14px to 16px for better visibility 


## Important Issues (Address Soon)

- **~~Type catch blocks properly~~** ✅ COMPLETED
  - Added proper error parameters to all catch blocks
  - Updated error logging to include error objects

- **~~Extract duplicate logic~~** ✅ PARTIALLY COMPLETED
  - ✅ Created `<PriorityBadge priority={project.priority} />` component
  - ✅ Replaced priority dot logic in ProjectTile and ProjectHeader
  - Create `useSyncItems()` hook for sync state calculation (still needed)
  - Logic duplicated in ConnectionStatus and SyncStatus (still needed)

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

- **~~Remove dead code~~** ✅ COMPLETED
  - ✅ Removed `createSlug()` function from `/lib/utils.ts`
  - ✅ Removed `getProjectBySlug()` function from projectStore

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
- Change width of sync status list to fit content

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
