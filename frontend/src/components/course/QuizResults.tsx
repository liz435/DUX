import { CheckCircle, XCircle, Trophy, RotateCcw, ArrowRight } from 'lucide-react';
import type { GradeResult } from '../../api/client';

interface Props {
  result: GradeResult;
  onRetry: () => void;
  onContinue: () => void;
}

export function QuizResults({ result, onRetry, onContinue }: Props) {
  const pct = Math.round(result.score * 100);
  const passed = result.score >= 0.7;

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div
          className={`inline-flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold mb-3 ${
            passed
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
          }`}
        >
          {pct}%
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy className={`h-4 w-4 ${passed ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          <p className="text-lg font-semibold">{passed ? 'Well done!' : 'Keep at it!'}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {result.correct_count} of {result.total_questions} correct
        </p>
      </div>

      <div className="space-y-2">
        {result.results.map((r) => (
          <div
            key={r.question_id}
            className={`rounded-xl border p-4 ${
              r.correct
                ? 'border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {r.correct ? (
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
              )}
              <span className="text-sm font-medium">{r.correct ? 'Correct' : 'Incorrect'}</span>
            </div>
            {!r.correct && (
              <p className="text-xs text-muted-foreground mb-1.5">
                Your answer:{' '}
                <span className="text-foreground">{r.user_answer || '(no answer)'}</span>
                {' — '}Correct:{' '}
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {r.correct_answer}
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">{r.explanation}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 flex-1 justify-center rounded-xl border-2 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Retry Quiz
        </button>
        <button
          onClick={onContinue}
          className="flex items-center gap-2 flex-1 justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
