import { useState, useCallback, useMemo } from 'react'
import { HierarchyHeader } from '@/components/hierarchy/hierarchy-header'
import { HierarchySummary } from '@/components/hierarchy/hierarchy-summary'
import { HierarchyToolbar } from '@/components/hierarchy/hierarchy-toolbar'
import { HierarchyNodeComponent } from '@/components/hierarchy/hierarchy-node'
import { AiInsightCard } from '@/components/hierarchy/ai-insight-card'
import type { HierarchyNode } from '@/types/hierarchy'

interface HierarchyTreeProps {
  data: HierarchyNode
  title?: string
  onEdit?: (node: HierarchyNode) => void
}

function collectAllIds(node: HierarchyNode): string[] {
  const ids = [node.id]
  if (node.children) {
    for (const child of node.children) {
      ids.push(...collectAllIds(child))
    }
  }
  return ids
}

function countNodes(node: HierarchyNode): number {
  let count = 1
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child)
    }
  }
  return count
}

/** Collect the root ID and all category-level IDs for default expansion */
function getDefaultExpanded(node: HierarchyNode): Set<string> {
  const ids = new Set([node.id])
  if (node.children) {
    for (const child of node.children) {
      if (child.type === 'category') {
        ids.add(child.id)
      }
    }
  }
  return ids
}

export function HierarchyTree({ data, title, onEdit }: HierarchyTreeProps) {
  const defaultExpanded = useMemo(() => getDefaultExpanded(data), [data])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpanded),
  )
  const [searchQuery, setSearchQuery] = useState('')

  const allIds = useMemo(() => collectAllIds(data), [data])
  const totalNodes = useMemo(() => countNodes(data), [data])

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(allIds))
  }, [allIds])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const reset = useCallback(() => {
    setExpandedIds(new Set(defaultExpanded))
    setSearchQuery('')
  }, [defaultExpanded])

  return (
    <div className="flex flex-col">
      <HierarchyHeader
        title={title}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalNodes={totalNodes}
        expandedCount={expandedIds.size}
      />

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        {/* Summary stats */}
        <HierarchySummary data={data} />

        {/* Root AI Insight */}
        {data.aiInsight && (
          <div className="mt-4">
            <AiInsightCard insight={data.aiInsight} />
          </div>
        )}

        {/* Toolbar */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">
            Course Structure
          </h2>
          <HierarchyToolbar
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            onReset={reset}
          />
        </div>

        {/* Tree */}
        <div className="mt-4 pb-12">
          <HierarchyNodeComponent
            node={data}
            depth={0}
            searchQuery={searchQuery}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            onEdit={onEdit}
            isLast={true}
            parentLines={[]}
          />
        </div>
      </div>
    </div>
  )
}
