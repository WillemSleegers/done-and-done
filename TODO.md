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

## Misc

- Explain to me the differences between a single-page app approach and one using a separate pages architecture
