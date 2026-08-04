"use client"

import { FolderOpen, Plus, SlidersHorizontal, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  {
    label: string
    getValue: (project: Project) => string
    buckets: GroupBucket[] | ((projects: Project[]) => GroupBucket[])
  }
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

function resolveBuckets(field: GroupByField, projects: Project[]): GroupBucket[] {
  const { buckets } = GROUP_BY_CONFIG[field]
  return typeof buckets === "function" ? buckets(projects) : buckets
}

const DEFAULT_GROUP_BY: GroupByField[] = ["status"]

const STORAGE_KEY = "projectGrid.viewOptions"

interface StoredViewOptions {
  groupBy: GroupByField[]
  hidden: Partial<Record<GroupByField, string[]>>
}

function loadStoredViewOptions(): StoredViewOptions | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredViewOptions
  } catch {
    return null
  }
}

interface ProjectGridProps {
  onSelectProject: (project: Project) => void
  onCreateProject: () => void
}

export default function ProjectGrid({ onSelectProject, onCreateProject }: ProjectGridProps) {
  const { projects, todoCounts, getProjectsSortedByOrder } = useProjectStore()
  const [groupBy, setGroupBy] = useState<GroupByField[]>(DEFAULT_GROUP_BY)
  const [hidden, setHidden] = useState<Partial<Record<GroupByField, Set<string>>>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadStoredViewOptions()
    if (stored) {
      // One-time hydration from localStorage after mount, avoiding an SSR/client markup mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroupBy(stored.groupBy)
      setHidden(
        Object.fromEntries(
          Object.entries(stored.hidden).map(([field, values]) => [field, new Set(values)])
        )
      )
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const toStore: StoredViewOptions = {
      groupBy,
      hidden: Object.fromEntries(
        Object.entries(hidden).map(([field, values]) => [field, Array.from(values ?? [])])
      ),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  }, [groupBy, hidden, hydrated])

  const allProjectsSorted = getProjectsSortedByOrder()

  const isBucketHidden = (field: GroupByField, value: string) => hidden[field]?.has(value) ?? false

  const toggleBucket = (field: GroupByField, value: string, show: boolean) => {
    setHidden((prev) => {
      const next = new Set(prev[field] ?? [])
      if (show) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return { ...prev, [field]: next }
    })
  }

  const hasActiveFilters = Object.values(hidden).some((values) => values && values.size > 0)

  const visibleProjects = allProjectsSorted.filter((project) =>
    GROUPABLE_FIELDS.every((field) => !isBucketHidden(field, GROUP_BY_CONFIG[field].getValue(project)))
  )

  const remainingFields = GROUPABLE_FIELDS.filter((field) => !groupBy.includes(field))

  const setGroupByFieldAt = (index: number, field: GroupByField) => {
    setGroupBy((prev) => prev.map((f, i) => (i === index ? field : f)))
  }

  const removeGroupByFieldAt = (index: number) => {
    setGroupBy((prev) => prev.filter((_, i) => i !== index))
  }

  const addGroupByField = (field: GroupByField) => {
    setGroupBy((prev) => [...prev, field])
  }

  const renderGroups = (fields: GroupByField[], projectsInScope: Project[], nested: boolean): React.ReactNode => {
    if (fields.length === 0) {
      return (
        <ProjectTableSection
          projects={projectsInScope}
          todoCounts={todoCounts}
          onSelectProject={onSelectProject}
          nested={nested}
        />
      )
    }

    const [field, ...rest] = fields
    const config = GROUP_BY_CONFIG[field]

    return resolveBuckets(field, allProjectsSorted).map((bucket) => {
      const bucketProjects = projectsInScope.filter((project) => config.getValue(project) === bucket.value)

      if (bucketProjects.length === 0) {
        return null
      }

      if (rest.length === 0) {
        return (
          <ProjectTableSection
            key={bucket.value}
            title={bucket.label}
            projects={bucketProjects}
            todoCounts={todoCounts}
            onSelectProject={onSelectProject}
            nested={nested}
          />
        )
      }

      return (
        <Collapsible key={bucket.value} defaultOpen>
          <CollapsibleTrigger className="mb-4 text-lg font-semibold text-muted-foreground hover:text-foreground">
            {bucket.label} ({bucketProjects.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-5 space-y-6">
            {renderGroups(rest, bucketProjects, true)}
          </CollapsibleContent>
        </Collapsible>
      )
    })
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative size-8">
                <SlidersHorizontal size={16} />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
                )}
                <span className="sr-only">View options</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Group by</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {groupBy.map((field, index) => {
                    const swapOptions = GROUPABLE_FIELDS.filter(
                      (f) => f === field || remainingFields.includes(f)
                    )

                    return (
                      <div
                        key={`${field}-${index}`}
                        className="flex h-7 items-center gap-0.5 rounded-full border bg-muted/50 pl-2.5 pr-1"
                      >
                        <Select
                          value={field}
                          onValueChange={(value) => setGroupByFieldAt(index, value as GroupByField)}
                        >
                          <SelectTrigger className="h-auto gap-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {swapOptions.map((f) => (
                              <SelectItem key={f} value={f}>
                                {GROUP_BY_CONFIG[f].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => removeGroupByFieldAt(index)}
                          className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X size={12} />
                          <span className="sr-only">Remove {GROUP_BY_CONFIG[field].label} grouping</span>
                        </button>
                      </div>
                    )
                  })}

                  {remainingFields.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-7 items-center gap-1 rounded-full border border-dashed px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Plus size={12} />
                          Add group
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {remainingFields.map((field) => (
                          <DropdownMenuItem key={field} onClick={() => addGroupByField(field)}>
                            {GROUP_BY_CONFIG[field].label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Show</p>
                <div className="space-y-3">
                  {GROUPABLE_FIELDS.map((field) => (
                    <div key={field} className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">{GROUP_BY_CONFIG[field].label}</p>
                      {resolveBuckets(field, allProjectsSorted).map((bucket) => {
                        const checked = !isBucketHidden(field, bucket.value)
                        return (
                          <label
                            key={bucket.value}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => toggleBucket(field, bucket.value, value === true)}
                            />
                            {bucket.label}
                          </label>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button size="sm" onClick={onCreateProject}>
            <Plus size={16} />
            New Project
          </Button>
        </div>

        <div className="space-y-6">{renderGroups(groupBy, visibleProjects, false)}</div>
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
