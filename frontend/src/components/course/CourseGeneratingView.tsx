import { CheckCircle, Loader2 } from 'lucide-react';
import type { AgentStep } from '../../api/client';

interface Props {
  steps: AgentStep[];
  error: string | null;
  onRetry: () => void;
}

export function CourseGeneratingView({ steps, error, onRetry }: Props) {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <h2 className="text-2xl font-bold text-center">Generating Your Course</h2>
      <p className="text-center text-muted-foreground">
        Our AI agents are building your personalized curriculum...
      </p>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md border p-3">
            {step.type === 'error' ? (
              <span className="text-destructive text-sm">Error</span>
            ) : i === steps.length - 1 && step.type !== 'complete' ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm">{step.message}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={onRetry}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
