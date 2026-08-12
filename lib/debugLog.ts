// Temporary navigation diagnostics for the iOS PWA back-navigation bug.
// Writes to localStorage so entries survive reloads, app kills, and the
// Web Inspector detaching. Remove once the bug is understood.

const STORAGE_KEY = "debug.navLog"
const MAX_ENTRIES = 80

export const DEBUG_LOG_EVENT = "debuglog"

export interface DebugEntry {
  time: string
  message: string
}

export function readDebugLog(): DebugEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DebugEntry[]) : []
  } catch {
    return []
  }
}

export function debugLog(message: string) {
  if (typeof window === "undefined") return
  try {
    const entries = readDebugLog()
    entries.push({ time: new Date().toISOString().slice(11, 23), message })
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
    window.dispatchEvent(new Event(DEBUG_LOG_EVENT))
  } catch {
    // Diagnostics must never break the app
  }
}

export function clearDebugLog() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(DEBUG_LOG_EVENT))
}

export function describeLocation() {
  return `${window.location.pathname}${window.location.search}`
}

export function shortId(id: string | null | undefined) {
  return id ? id.slice(0, 8) : "null"
}
