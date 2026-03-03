import { Clock, Database, Target } from 'lucide-react'

interface NodeMetadataProps {
  metadata: {
    source?: string
    lastUpdated?: string
    relevance?: number
  }
}

export function NodeMetadata({ metadata }: NodeMetadataProps) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
      {metadata.source && (
        <span className="flex items-center gap-1">
          <Database className="h-2.5 w-2.5" />
          {metadata.source}
        </span>
      )}
      {metadata.lastUpdated && (
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {metadata.lastUpdated}
        </span>
      )}
      {metadata.relevance !== undefined && (
        <span className="flex items-center gap-1">
          <Target className="h-2.5 w-2.5" />
          {Math.round(metadata.relevance * 100)}% difficulty
        </span>
      )}
    </div>
  )
}
