import { BookOpen, FolderOpen, Clock, CheckCircle } from 'lucide-react'
import type { HierarchyNode } from '@/types/hierarchy'

interface HierarchySummaryProps {
  data: HierarchyNode
}

function countByType(node: HierarchyNode, type: string): number {
  let count = node.type === type ? 1 : 0
  if (node.children) {
    for (const child of node.children) {
      count += countByType(child, type)
    }
  }
  return count
}

function countCompleted(node: HierarchyNode): number {
  let count = node.tags?.includes('Completed') ? 1 : 0
  if (node.children) {
    for (const child of node.children) {
      count += countCompleted(child)
    }
  }
  return count
}

function sumEstimatedTime(node: HierarchyNode): number {
  let total = 0
  if (node.metadata?.source) {
    const match = node.metadata.source.match(/(\d+)\s*min/)
    if (match) total += parseInt(match[1], 10)
  }
  if (node.children) {
    for (const child of node.children) {
      total += sumEstimatedTime(child)
    }
  }
  return total
}

export function HierarchySummary({ data }: HierarchySummaryProps) {
  const totalLessons = countByType(data, 'topic')
  const totalModules = countByType(data, 'category')
  const completedLessons = countCompleted(data)
  const estMinutes = sumEstimatedTime(data)

  const stats = [
    {
      icon: BookOpen,
      label: 'Lessons',
      value: totalLessons,
      color: 'text-primary',
    },
    {
      icon: FolderOpen,
      label: 'Modules',
      value: totalModules,
      color: 'text-chart-2',
    },
    {
      icon: Clock,
      label: 'Est. Time',
      value: `${estMinutes}m`,
      color: 'text-chart-4',
    },
    {
      icon: CheckCircle,
      label: 'Completed',
      value: completedLessons,
      color: 'text-chart-5',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/20"
        >
          <div className="flex items-center gap-2">
            <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </span>
          </div>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  )
}
