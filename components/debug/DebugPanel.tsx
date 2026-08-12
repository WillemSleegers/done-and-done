"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  clearDebugLog,
  DEBUG_LOG_EVENT,
  type DebugEntry,
  readDebugLog,
} from "@/lib/debugLog"

export default function DebugPanel() {
  const [entries, setEntries] = useState<DebugEntry[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const sync = () => setEntries(readDebugLog())
    sync()
    window.addEventListener(DEBUG_LOG_EVENT, sync)
    return () => window.removeEventListener(DEBUG_LOG_EVENT, sync)
  }, [])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-lg backdrop-blur"
      >
        Debug {entries.length}
      </button>
    )
  }

  return (
    <div className="fixed inset-x-2 bottom-2 z-50 max-h-[50vh] overflow-y-auto rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium">Nav log ({entries.length})</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={clearDebugLog}>
            Clear
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
            Hide
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No entries yet.</p>
      ) : (
        <ol className="space-y-1">
          {entries
            .slice()
            .reverse()
            .map((entry, index) => (
              <li key={`${entry.time}-${index}`} className="font-mono text-[10px] leading-tight break-all">
                <span className="text-muted-foreground">{entry.time}</span> {entry.message}
              </li>
            ))}
        </ol>
      )}
    </div>
  )
}
