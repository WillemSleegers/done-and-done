# TODO

- Split large files?
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

## Minor Polish Items

- **Standardize quote usage**
  - Mixed single and double quotes throughout codebase
  - Configure ESLint/Prettier to enforce consistent style (recommend single quotes)

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
  - Check positioning of loading spinners 
    - Should be placed in the same place throughout the app

- **Standardize import ordering**
  - Establish consistent order:
    1. External libraries (React, Next.js)
    2. Type imports
    3. Internal lib imports
    4. Component imports
    5. Utility imports
    6. Style imports

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
