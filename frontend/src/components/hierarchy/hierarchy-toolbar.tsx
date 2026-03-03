import { Maximize2, Minimize2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HierarchyToolbarProps {
  onExpandAll: () => void
  onCollapseAll: () => void
  onReset: () => void
}

export function HierarchyToolbar({
  onExpandAll,
  onCollapseAll,
  onReset,
}: HierarchyToolbarProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={onExpandAll}
        className="h-7 gap-1.5 px-2.5 text-xs border-border bg-secondary text-secondary-foreground hover:bg-muted hover:text-foreground"
      >
        <Maximize2 className="h-3 w-3" />
        Expand All
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onCollapseAll}
        className="h-7 gap-1.5 px-2.5 text-xs border-border bg-secondary text-secondary-foreground hover:bg-muted hover:text-foreground"
      >
        <Minimize2 className="h-3 w-3" />
        Collapse
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="h-7 gap-1.5 px-2.5 text-xs border-border bg-secondary text-secondary-foreground hover:bg-muted hover:text-foreground"
      >
        <RotateCcw className="h-3 w-3" />
        Reset
      </Button>
    </div>
  )
}
