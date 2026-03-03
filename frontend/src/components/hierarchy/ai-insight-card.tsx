import { Sparkles } from 'lucide-react'

interface AiInsightCardProps {
  insight: string
}

export function AiInsightCard({ insight }: AiInsightCardProps) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
      <p className="text-[11px] leading-relaxed text-primary/90">{insight}</p>
    </div>
  )
}
