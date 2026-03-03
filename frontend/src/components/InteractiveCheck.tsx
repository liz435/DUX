import { useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb, RotateCcw, ChevronDown, Brain, BookOpen, Compass } from 'lucide-react';
import { DynamicUI } from './DynamicUI';
import { api } from '../api/client';
import type { DynamicFormSchema, FormValues } from '../types/dynamic-ui';
import type { CheckInteractiveResponse } from '../api/client';

interface InteractiveCheckProps {
  schema: DynamicFormSchema;
  courseId: string;
  lessonIdx: number;
  elementIdx: number;
}

type CheckState = 'idle' | 'submitting' | 'feedback';

function getCheckIcon(title?: string) {
  const t = (title || '').toLowerCase();
  if (t.includes('check') || t.includes('recall') || t.includes('quiz')) return Brain;
  if (t.includes('reflect') || t.includes('think')) return BookOpen;
  if (t.includes('explore') || t.includes('experiment')) return Compass;
  return Brain;
}

export function InteractiveCheck({ schema, courseId, lessonIdx, elementIdx }: InteractiveCheckProps) {
  const [state, setState] = useState<CheckState>('idle');
  const [result, setResult] = useState<CheckInteractiveResponse | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const CheckIcon = getCheckIcon(schema.title);

  const handleSubmit = async (values: FormValues) => {
    setState('submitting');
    try {
      const response = await api.checkInteractiveAnswer(courseId, lessonIdx, elementIdx, values);
      setResult(response);
      setState('feedback');
    } catch {
      // Fallback: client-side check if API fails
      if (schema.correct_answer) {
        const allCorrect = Object.entries(schema.correct_answer).every(
          ([fieldId, expected]) =>
            String(values[fieldId] || '').trim().toLowerCase() ===
            String(expected).trim().toLowerCase()
        );
        setResult({
          correct: allCorrect,
          score: allCorrect ? 1.0 : 0.0,
          correct_answer: schema.correct_answer,
          explanation: schema.explanation || '',
          feedback: allCorrect ? 'Correct!' : 'Not quite — try reviewing the material above.',
        });
      } else {
        setResult({
          correct: true,
          score: 1.0,
          correct_answer: {},
          explanation: schema.explanation || 'Great response!',
          feedback: 'Thanks for your answer!',
        });
      }
      setState('feedback');
    }
  };

  const handleRetry = () => {
    setState('idle');
    setResult(null);
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border bg-muted/30 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="font-medium">{schema.title || 'Knowledge Check'}</span>
        <span className="ml-auto text-xs">Completed</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
        state === 'feedback'
          ? result?.correct
            ? 'border-green-500/40 shadow-[0_0_15px_-3px_rgba(34,197,94,0.15)]'
            : 'border-amber-500/40 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]'
          : 'border-border shadow-sm'
      }`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          state === 'feedback'
            ? result?.correct
              ? 'bg-green-500'
              : 'bg-amber-500'
            : 'bg-primary/60'
        }`}
      />

      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center gap-3 ${
        state === 'feedback'
          ? result?.correct
            ? 'bg-green-50 dark:bg-green-950/20'
            : 'bg-amber-50 dark:bg-amber-950/20'
          : 'bg-muted/30'
      }`}>
        <div className={`p-1.5 rounded-lg ${
          state === 'feedback'
            ? result?.correct
              ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
              : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
            : 'bg-primary/10 text-primary'
        }`}>
          {state === 'feedback' ? (
            result?.correct ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )
          ) : (
            <CheckIcon className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {state === 'feedback'
              ? result?.correct
                ? 'Correct!'
                : 'Not quite...'
              : schema.title || 'Knowledge Check'}
          </h3>
          {state !== 'feedback' && schema.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{schema.description}</p>
          )}
        </div>
        {state === 'feedback' && result && (
          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
            result.correct
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
          }`}>
            {Math.round(result.score * 100)}%
          </div>
        )}
      </div>

      {/* Body */}
      <div className="pl-4">
        {state === 'feedback' && result ? (
          <div className="p-6 space-y-4">
            {/* Feedback message */}
            <p className={`text-sm font-medium ${
              result.correct ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
            }`}>
              {result.feedback}
            </p>

            {/* Explanation */}
            {result.explanation && (
              <div className="flex gap-3 p-3 rounded-xl bg-muted/40 border">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              {!result.correct && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border hover:bg-muted/50 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Try Again
                </button>
              )}
              <button
                onClick={() => setCollapsed(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <DynamicUI
            schema={{ ...schema, title: undefined, description: undefined }}
            onSubmit={handleSubmit}
            submitLabel={state === 'submitting' ? 'Checking...' : 'Check Answer'}
            className="border-0 shadow-none rounded-none"
            disabled={state === 'submitting'}
          />
        )}
      </div>
    </div>
  );
}
