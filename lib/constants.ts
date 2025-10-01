/**
 * Application-wide constants
 */

// Touch interaction delays (milliseconds)
export const TOUCH_DELAYS = {
  TODO_LONG_PRESS: 150,
  PROJECT_LONG_PRESS: 200,
  TODO_DRAG_ACTIVATION: 100,
  PROJECT_DRAG_ACTIVATION: 200,
} as const

// Sync timing configuration (milliseconds)
export const SYNC_TIMING = {
  BASE_RETRY_DELAY: 10000, // 10 seconds
  MAX_RETRY_DELAY: 60000, // 60 seconds (1 minute)
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  AUTH_TIMEOUT: 15000, // 15 seconds
} as const

// Display limits
export const DISPLAY_LIMITS = {
  RECENT_ACTIVITY_COUNT: 5,
  SYNCING_ITEMS_PREVIEW: 5,
} as const

// Drag and drop constraints
export const DRAG_CONSTRAINTS = {
  POINTER_DISTANCE: 8,
  TOUCH_TOLERANCE: 5,
} as const

// Input validation limits
export const INPUT_LIMITS = {
  PROJECT_NAME_MAX: 255,
  TODO_TEXT_MAX: 1000,
  NOTES_MAX: 10000,
} as const
