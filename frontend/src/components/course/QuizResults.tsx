import { CheckCircle, XCircle } from 'lucide-react';
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
      <div className="text-center">
        <div
          className={`inline-flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold ${
            passed ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}
        >
          {pct}%
        </div>
        <p className="mt-2 text-lg font-medium">
          {passed ? 'Great job!' : 'Keep practicing!'}
        </p>
        <p className="text-sm text-muted-foreground">
          {result.correct_count} of {result.total_questions} correct
        </p>
      </div>

      <div className="space-y-3">
        {result.results.map((r) => (
          <div key={r.question_id} className="rounded-md border p-4">
            <div className="flex items-center gap-2 mb-2">
              {r.correct ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {r.correct ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            {!r.correct && (
              <p className="text-sm text-muted-foreground mb-1">
                Your answer: {r.user_answer || '(no answer)'} — Correct: {r.correct_answer}
              </p>
            )}
            <p className="text-sm text-muted-foreground">{r.explanation}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={onRetry}
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
        >
          Retry Quiz
        </button>
        <button
          onClick={onContinue}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
