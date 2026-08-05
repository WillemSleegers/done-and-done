"use client"

import { type ReactNode } from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface GroupPanelProps {
  title: string
  count: number
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export default function GroupPanel({ title, count, open, onOpenChange, children }: GroupPanelProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="block w-full px-1 py-2 text-left text-sm font-semibold text-muted-foreground hover:text-foreground">
        {title} ({count})
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}
