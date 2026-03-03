"use client"

import { Sparkles, GitBranch, Layers, AlertTriangle } from "lucide-react"
import type { HierarchyNode } from "@/lib/hierarchy-data"

interface HierarchySummaryProps {
  data: HierarchyNode
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

function countInsights(node: HierarchyNode): number {
  let count = node.aiInsight ? 1 : 0
  if (node.children) {
    for (const child of node.children) {
      count += countInsights(child)
    }
  }
  return count
}

function countAttentionItems(node: HierarchyNode): number {
  let count = node.tags?.some((t) =>
    ["Critical", "Attention", "Watch", "Monitor", "Priority"].includes(t)
  )
    ? 1
    : 0
  if (node.children) {
    for (const child of node.children) {
      count += countAttentionItems(child)
    }
  }
  return count
}

function maxDepth(node: HierarchyNode, depth = 0): number {
  if (!node.children || node.children.length === 0) return depth
  return Math.max(...node.children.map((c) => maxDepth(c, depth + 1)))
}

export function HierarchySummary({ data }: HierarchySummaryProps) {
  const totalNodes = countNodes(data)
  const totalInsights = countInsights(data)
  const attentionItems = countAttentionItems(data)
  const depth = maxDepth(data)

  const stats = [
    {
      icon: Layers,
      label: "Total Nodes",
      value: totalNodes,
      color: "text-primary",
    },
    {
      icon: GitBranch,
      label: "Max Depth",
      value: depth,
      color: "text-chart-2",
    },
    {
      icon: Sparkles,
      label: "AI Insights",
      value: totalInsights,
      color: "text-chart-4",
    },
    {
      icon: AlertTriangle,
      label: "Needs Attention",
      value: attentionItems,
      color: "text-chart-5",
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
