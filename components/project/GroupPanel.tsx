"use client"

import { type ReactNode } from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface GroupPanelProps {
  title: string
  count: number
  tone?: "muted" | "background"
  children: ReactNode
}

export default function GroupPanel({ title, count, tone = "muted", children }: GroupPanelProps) {
  const toneClass = tone === "muted" ? "bg-muted" : "bg-background"

  return (
    <Collapsible defaultOpen>
      <div className={cn("overflow-hidden rounded-lg border", toneClass)}>
        <CollapsibleTrigger
          className={cn(
            "block w-full px-3 py-2 text-left text-sm font-semibold text-muted-foreground hover:text-foreground",
            toneClass
          )}
        >
          {title} ({count})
        </CollapsibleTrigger>
        <CollapsibleContent className={cn("px-4 pb-4", toneClass)}>{children}</CollapsibleContent>
      </div>
    </Collapsible>
  )
}
