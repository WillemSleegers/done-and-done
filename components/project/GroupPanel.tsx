"use client"

import { type ReactNode } from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface GroupPanelProps {
  title: string
  count: number
  children: ReactNode
}

export default function GroupPanel({ title, count, children }: GroupPanelProps) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="block w-full px-1 py-2 text-left text-sm font-semibold text-muted-foreground hover:text-foreground">
        {title} ({count})
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}
