"use client"

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface ConfidenceBarProps {
  confidence: number
}

export function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100)
  const getColor = () => {
    if (confidence >= 0.9) return "bg-primary"
    if (confidence >= 0.75) return "bg-chart-4"
    return "bg-destructive"
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <div className="h-1 w-12 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {percentage}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <span>AI Confidence: {percentage}%</span>
      </TooltipContent>
    </Tooltip>
  )
}
