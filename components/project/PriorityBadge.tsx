import { type Project } from '@/lib/services/syncService'

interface PriorityBadgeProps {
  priority: Project['priority']
  size?: 'sm' | 'md'
}

export default function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'

  const colorClass =
    priority === 'high'
      ? 'bg-destructive'
      : priority === 'normal'
      ? 'bg-primary'
      : 'bg-muted-foreground'

  return <div className={`${sizeClass} ${colorClass} rounded-full`} />
}