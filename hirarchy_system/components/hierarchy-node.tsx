"use client"

import { useState, useCallback } from "react"
import {
  ChevronRight,
  Layers,
  FolderOpen,
  BookOpen,
  FileText,
  Lightbulb,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AiInsightCard } from "@/components/ai-insight-card"
import { ConfidenceBar } from "@/components/confidence-bar"
import { NodeMetadata } from "@/components/node-metadata"
import type { HierarchyNode } from "@/lib/hierarchy-data"
import { cn } from "@/lib/utils"

interface HierarchyNodeComponentProps {
  node: HierarchyNode
  depth: number
  searchQuery: string
  expandedIds: Set<string>
  onToggle: (id: string) => void
  isLast: boolean
  parentLines: boolean[]
}

const typeConfig = {
  root: {
    icon: Layers,
    color: "text-primary",
    bg: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  category: {
    icon: FolderOpen,
    color: "text-chart-1",
    bg: "bg-chart-1/10",
    borderColor: "border-chart-1/20",
  },
  topic: {
    icon: BookOpen,
    color: "text-chart-2",
    bg: "bg-chart-2/10",
    borderColor: "border-chart-2/20",
  },
  item: {
    icon: FileText,
    color: "text-muted-foreground",
    bg: "bg-secondary",
    borderColor: "border-border",
  },
  insight: {
    icon: Lightbulb,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
    borderColor: "border-chart-4/20",
  },
}

const tagColorMap: Record<string, string> = {
  Critical: "border-destructive/40 text-destructive bg-destructive/10",
  Priority: "border-chart-4/40 text-chart-4 bg-chart-4/10",
  Attention: "border-chart-5/40 text-chart-5 bg-chart-5/10",
  Watch: "border-chart-5/40 text-chart-5 bg-chart-5/10",
  Monitor: "border-chart-4/40 text-chart-4 bg-chart-4/10",
  Active: "border-primary/40 text-primary bg-primary/10",
  Stable: "border-chart-2/40 text-chart-2 bg-chart-2/10",
  Compliant: "border-chart-2/40 text-chart-2 bg-chart-2/10",
}

function matchesSearch(node: HierarchyNode, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  if (node.label.toLowerCase().includes(q)) return true
  if (node.summary?.toLowerCase().includes(q)) return true
  if (node.aiInsight?.toLowerCase().includes(q)) return true
  if (node.tags?.some((t) => t.toLowerCase().includes(q))) return true
  if (node.children?.some((child) => matchesSearch(child, q))) return true
  return false
}

export function HierarchyNodeComponent({
  node,
  depth,
  searchQuery,
  expandedIds,
  onToggle,
  isLast,
  parentLines,
}: HierarchyNodeComponentProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children && node.children.length > 0
  const config = typeConfig[node.type]
  const Icon = config.icon

  const isVisible = matchesSearch(node, searchQuery)
  if (!isVisible) return null

  const handleToggle = useCallback(() => {
    onToggle(node.id)
  }, [node.id, onToggle])

  return (
    <div className="select-none">
      {/* Tree lines and node */}
      <div className="flex">
        {/* Vertical guide lines from parents */}
        {depth > 0 && (
          <div className="flex" aria-hidden="true">
            {parentLines.map((hasLine, i) => (
              <div key={i} className="relative w-6 shrink-0">
                {hasLine && (
                  <div className="absolute left-3 top-0 h-full w-px bg-node-line" />
                )}
              </div>
            ))}
            {/* Connector line for this node */}
            <div className="relative w-6 shrink-0">
              <div
                className={cn(
                  "absolute left-3 top-0 w-px bg-node-line",
                  isLast ? "h-4" : "h-full"
                )}
              />
              <div className="absolute left-3 top-4 h-px w-3 bg-node-line" />
            </div>
          </div>
        )}

        {/* Node content */}
        <div
          className={cn(
            "group flex-1 rounded-lg border transition-all duration-200 my-0.5",
            config.borderColor,
            isHovered && "border-primary/40 shadow-[0_0_12px_var(--node-glow)]",
            depth === 0 && "border-primary/30"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main clickable area */}
          <button
            onClick={handleToggle}
            className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
            aria-expanded={hasChildren ? isExpanded : undefined}
          >
            {/* Expand chevron */}
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
              {hasChildren ? (
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-90 text-primary"
                  )}
                />
              ) : (
                <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              )}
            </div>

            {/* Icon */}
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded",
                config.bg
              )}
            >
              <Icon className={cn("h-3 w-3", config.color)} />
            </div>

            {/* Text content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium text-foreground truncate",
                    depth === 0 && "text-base"
                  )}
                >
                  {node.label}
                </span>
                {node.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1.5 py-0 h-4 font-medium",
                      tagColorMap[tag] || "border-border text-muted-foreground"
                    )}
                  >
                    {tag}
                  </Badge>
                ))}
                {node.confidence !== undefined && (
                  <div className="ml-auto hidden group-hover:flex">
                    <ConfidenceBar confidence={node.confidence} />
                  </div>
                )}
              </div>

              {node.summary && (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {node.summary}
                </p>
              )}

              {/* AI Insight - shown on expand */}
              {isExpanded && node.aiInsight && (
                <AiInsightCard insight={node.aiInsight} />
              )}

              {/* Metadata - shown on expand */}
              {isExpanded && node.metadata && (
                <NodeMetadata metadata={node.metadata} />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            isExpanded ? "animate-in fade-in slide-in-from-top-1 duration-300" : ""
          )}
        >
          {node.children!.map((child, index) => (
            <HierarchyNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
              expandedIds={expandedIds}
              onToggle={onToggle}
              isLast={index === node.children!.length - 1}
              parentLines={
                depth > 0
                  ? [...parentLines, !isLast]
                  : [!isLast || index < node.children!.length - 1 ? true : false]
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
