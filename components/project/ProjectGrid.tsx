"use client"

import { FolderOpen, Plus } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Project } from "@/lib/services/syncService"
import { useProjectStore } from "@/lib/store/projectStore"

import ProjectTableSection from "./ProjectTableSection"

type GroupByField = "status" | "priority"

interface GroupBucket {
  value: string
  label: string
}

const GROUP_BY_CONFIG: Record<
  GroupByField,
  { label: string; buckets: GroupBucket[]; getValue: (project: Project) => string }
> = {
  status: {
    label: "Status",
    getValue: (project) => project.status,
    buckets: [
      { value: "active", label: "Active Projects" },
      { value: "inactive", label: "Inactive Projects" },
      { value: "complete", label: "Completed Projects" },
    ],
  },
  priority: {
    label: "Priority",
    getValue: (project) => project.priority,
    buckets: [
      { value: "high", label: "High Priority" },
      { value: "normal", label: "Normal Priority" },
      { value: "low", label: "Low Priority" },
    ],
  },
}

const GROUPABLE_FIELDS: GroupByField[] = ["status", "priority"]

interface ProjectGridProps {
  onSelectProject: (project: Project) => void
  onCreateProject: () => void
}

export default function ProjectGrid({ onSelectProject, onCreateProject }: ProjectGridProps) {
  const { projects, todoCounts, getProjectsSortedByOrder } = useProjectStore()
  const [groupBy, setGroupBy] = useState<GroupByField[]>(["status"])

  const allProjectsSorted = getProjectsSortedByOrder()

  const primary = groupBy[0]
  const secondary = groupBy[1]
  const primaryConfig = GROUP_BY_CONFIG[primary]
  const secondaryConfig = secondary ? GROUP_BY_CONFIG[secondary] : undefined
  const secondaryOptions = GROUPABLE_FIELDS.filter((field) => field !== primary)

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Group by</span>
            <Select
              value={primary}
              onValueChange={(value) => {
                const nextPrimary = value as GroupByField
                setGroupBy(secondary && secondary !== nextPrimary ? [nextPrimary, secondary] : [nextPrimary])
              }}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUPABLE_FIELDS.map((field) => (
                  <SelectItem key={field} value={field}>
                    {GROUP_BY_CONFIG[field].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground">then by</span>
            <Select
              value={secondary ?? "none"}
              onValueChange={(value) =>
                setGroupBy(value === "none" ? [primary] : [primary, value as GroupByField])
              }
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {secondaryOptions.map((field) => (
                  <SelectItem key={field} value={field}>
                    {GROUP_BY_CONFIG[field].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={onCreateProject}>
            <Plus size={16} />
            New Project
          </Button>
        </div>

        <div className="space-y-6">
          {primaryConfig.buckets.map((bucket) => {
            const bucketProjects = allProjectsSorted.filter(
              (project) => primaryConfig.getValue(project) === bucket.value
            )

            if (bucketProjects.length === 0) {
              return null
            }

            if (!secondaryConfig) {
              return (
                <ProjectTableSection
                  key={bucket.value}
                  title={bucket.label}
                  projects={bucketProjects}
                  todoCounts={todoCounts}
                  onSelectProject={onSelectProject}
                />
              )
            }

            return (
              <Collapsible key={bucket.value} defaultOpen>
                <CollapsibleTrigger className="mb-4 text-lg font-semibold text-muted-foreground hover:text-foreground">
                  {bucket.label} ({bucketProjects.length})
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-5 space-y-6">
                  {secondaryConfig.buckets.map((subBucket) => {
                    const subProjects = bucketProjects.filter(
                      (project) => secondaryConfig.getValue(project) === subBucket.value
                    )

                    if (subProjects.length === 0) {
                      return null
                    }

                    return (
                      <ProjectTableSection
                        key={subBucket.value}
                        title={subBucket.label}
                        projects={subProjects}
                        todoCounts={todoCounts}
                        onSelectProject={onSelectProject}
                        nested
                      />
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </div>

      {projects.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">
          <FolderOpen size={48} className="mx-auto mb-4 text-muted" />
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      )}
    </div>
  )
}
