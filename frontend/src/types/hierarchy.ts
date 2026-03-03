export interface HierarchyNode {
  id: string
  label: string
  type: 'root' | 'category' | 'topic' | 'item' | 'insight'
  summary?: string
  aiInsight?: string
  tags?: string[]
  confidence?: number
  children?: HierarchyNode[]
  metadata?: {
    source?: string
    lastUpdated?: string
    relevance?: number
  }
  /** Index of the corresponding lesson (set on topic nodes) */
  lessonIndex?: number
}
