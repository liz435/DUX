import { useEffect, useRef, useState } from 'react';
import type { AgentStep } from '../../api/client';

interface Props {
  steps: AgentStep[];
  error: string | null;
  onRetry: () => void;
}

const STEP_CFG: Record<string, { color: string; icon: string; indent: boolean }> = {
  planning:          { color: 'text-blue-400',   icon: '◆', indent: false },
  outline_ready:           { color: 'text-green-400',  icon: '✓', indent: false },
  awaiting_confirmation:   { color: 'text-amber-400',  icon: '⏸', indent: false },
  generating_lesson:       { color: 'text-cyan-400',   icon: '◈', indent: true  },
  lesson_ready:      { color: 'text-green-400',  icon: '✓', indent: true  },
  generating_quiz:   { color: 'text-amber-400',  icon: '◈', indent: true  },
  quiz_ready:        { color: 'text-amber-400',  icon: '✓', indent: true  },
  tutor_feedback:    { color: 'text-purple-400', icon: '◆', indent: false },
  complete:          { color: 'text-green-300',  icon: '✓', indent: false },
  error:             { color: 'text-red-400',    icon: '✗', indent: false },
};

const FALLBACK_CFG = { color: 'text-zinc-400', icon: '·', indent: false };
const TYPING_MS = 16;

export function CourseGeneratingView({ steps, error, onRetry }: Props) {
  const [revealed, setRevealed] = useState(0);
  const [typed, setTyped] = useState('');
  const [blink, setBlink] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Blinking cursor
  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 520);
    return () => clearInterval(t);
  }, []);

  // Typewriter: animate each new step as it arrives
  useEffect(() => {
    if (revealed >= steps.length) return;

    const text = steps[revealed].message;
    let i = 0;
    setTyped('');

    const id = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setRevealed(c => c + 1);
      }
    }, TYPING_MS);

    return () => clearInterval(id);
  }, [revealed, steps.length]);

  // Auto-scroll to bottom on each new character / new step
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [revealed, typed]);

  const isDone  = steps.some(s => s.type === 'complete' || s.type === 'awaiting_confirmation');
  const isTyping = revealed < steps.length;
  const typingStep = isTyping ? steps[revealed] : null;

  return (
    <div className="mx-auto max-w-2xl py-10 px-4">
      {/* Status header */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <span className={`h-2 w-2 rounded-full shrink-0 ${isDone ? 'bg-green-500' : error ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`} />
        <span className="text-sm font-medium">
          {isDone ? 'Course ready!' : error ? 'Generation failed' : 'Building your course…'}
        </span>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {revealed} line{revealed !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Terminal window */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* macOS-style chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="h-3 w-3 rounded-full bg-zinc-700 hover:bg-red-500 transition-colors" />
          <div className="h-3 w-3 rounded-full bg-zinc-700 hover:bg-yellow-500 transition-colors" />
          <div className="h-3 w-3 rounded-full bg-zinc-700 hover:bg-green-500 transition-colors" />
          <span className="ml-3 text-xs text-zinc-500 font-mono select-none">dux · agent stream</span>
        </div>

        {/* Output lines */}
        <div
          ref={scrollRef}
          className="p-5 font-mono text-[13px] leading-6 min-h-72 max-h-105 overflow-y-auto space-y-1 scroll-smooth"
        >
          {/* Empty state: waiting for first event */}
          {steps.length === 0 && (
            <div className="flex items-center gap-2 text-zinc-600">
              <span>$</span>
              <span>Connecting to agents</span>
              <span className={`inline-block w-px h-[1em] bg-zinc-500 align-middle ml-0.5 ${blink ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          )}

          {/* Fully revealed steps */}
          {steps.slice(0, revealed).map((step, i) => {
            const cfg = STEP_CFG[step.type] ?? FALLBACK_CFG;
            return (
              <div key={i} className={`flex items-start gap-2.5 ${cfg.indent ? 'pl-5' : ''}`}>
                <span className={`${cfg.color} shrink-0 select-none mt-px`}>{cfg.icon}</span>
                <span className={`${step.type === 'complete' ? 'text-green-300 font-medium' : step.type === 'error' ? 'text-red-400' : 'text-zinc-200'}`}>
                  {step.message}
                </span>
              </div>
            );
          })}

          {/* Currently typing step */}
          {typingStep && (
            <div className={`flex items-start gap-2.5 ${(STEP_CFG[typingStep.type] ?? FALLBACK_CFG).indent ? 'pl-5' : ''}`}>
              <span className={`${(STEP_CFG[typingStep.type] ?? FALLBACK_CFG).color} shrink-0 select-none mt-px`}>
                {(STEP_CFG[typingStep.type] ?? FALLBACK_CFG).icon}
              </span>
              <span className="text-zinc-200">
                {typed}
                <span className={`inline-block w-px h-[1em] bg-zinc-300 align-middle ml-px transition-opacity ${blink ? 'opacity-100' : 'opacity-0'}`} />
              </span>
            </div>
          )}

          {/* Idle cursor: all steps shown but not done yet */}
          {!isTyping && !isDone && !error && steps.length > 0 && (
            <div className="flex items-center gap-2.5 text-zinc-600">
              <span className="select-none">·</span>
              <span className={`inline-block w-px h-[1em] bg-zinc-600 align-middle ${blink ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          )}
        </div>
      </div>

      {/* Error action */}
      {error && (
        <div className="mt-5 text-center space-y-3">
          <p className="text-sm text-destructive font-mono">{error}</p>
          <button
            onClick={onRetry}
            className="rounded-xl bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
