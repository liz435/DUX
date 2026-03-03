import { BookOpen, Search } from 'lucide-react'

interface HierarchyHeaderProps {
  title?: string
  searchQuery: string
  onSearchChange: (query: string) => void
  totalNodes: number
  expandedCount: number
}

export function HierarchyHeader({
  title = 'Course Syllabus',
  searchQuery,
  onSearchChange,
  totalNodes,
  expandedCount,
}: HierarchyHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-6 py-5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                {title}
              </h1>
              <p className="text-xs text-muted-foreground">
                {totalNodes} items &middot; {expandedCount} expanded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search syllabus..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-8 w-56 rounded-md border border-border bg-secondary pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
