"use client"

import { useState, useCallback, useMemo } from "react"
import { HierarchyHeader } from "@/components/hierarchy-header"
import { HierarchySummary } from "@/components/hierarchy-summary"
import { HierarchyToolbar } from "@/components/hierarchy-toolbar"
import { HierarchyNodeComponent } from "@/components/hierarchy-node"
import { AiInsightCard } from "@/components/ai-insight-card"
import type { HierarchyNode } from "@/lib/hierarchy-data"

interface HierarchyTreeProps {
  data: HierarchyNode
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

const DEFAULT_EXPANDED = new Set(["root", "engineering", "product", "operations"])

export function HierarchyTree({ data }: HierarchyTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(DEFAULT_EXPANDED)
  )
  const [searchQuery, setSearchQuery] = useState("")

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
    setExpandedIds(new Set(DEFAULT_EXPANDED))
    setSearchQuery("")
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HierarchyHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalNodes={totalNodes}
        expandedCount={expandedIds.size}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
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
            Hierarchy Explorer
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
            isLast={true}
            parentLines={[]}
          />
        </div>
      </main>
    </div>
  )
}
