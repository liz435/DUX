import { useState } from 'react';
import {
  CheckCircle2, Sparkles, RotateCcw, ChevronDown, ChevronUp,
  Clock, BookOpen, Plus, Trash2, GripVertical,
} from 'lucide-react';
import { api } from '../../api/client';
import type { Course, Lesson } from '../../api/client';
import { useCourseStore } from '../../store/courseStore';

interface Props {
  course: Course;
  onConfirm: () => void;
  onReset: () => void;
  isConfirming: boolean;
}

interface LessonCardProps {
  lesson: Lesson;
  courseId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function LessonCard({ lesson, courseId, isExpanded, onToggle }: LessonCardProps) {
  const setCourse = useCourseStore((s) => s.setCourse);
  const [title, setTitle] = useState(lesson.title);
  const [summary, setSummary] = useState(lesson.summary);
  const [keyTopics, setKeyTopics] = useState<string[]>([...lesson.key_topics]);
  const [estimatedMinutes, setEstimatedMinutes] = useState(lesson.estimated_minutes);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => { if (!dirty) setDirty(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { course: updated } = await api.updateLessonOutline(courseId, lesson.index, {
        title,
        summary,
        key_topics: keyTopics.filter((t) => t.trim()),
        estimated_minutes: estimatedMinutes,
      });
      setCourse(updated);
      setDirty(false);
    } catch {
      // silently fail — user can retry
    } finally {
      setSaving(false);
    }
  };

  const addTopic = () => { setKeyTopics([...keyTopics, '']); markDirty(); };
  const removeTopic = (idx: number) => { setKeyTopics(keyTopics.filter((_, i) => i !== idx)); markDirty(); };
  const updateTopic = (idx: number, value: string) => {
    setKeyTopics(keyTopics.map((t, i) => (i === idx ? value : t)));
    markDirty();
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:border-primary/30">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
          {lesson.index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{lesson.title}</div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">{lesson.summary}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {lesson.estimated_minutes}m
          </span>
          {lesson.has_quiz && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
              Quiz
            </span>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded edit form */}
      {isExpanded && (
        <div className="border-t px-4 py-4 space-y-4 bg-muted/10 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty(); }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => { setSummary(e.target.value); markDirty(); }}
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Key Topics */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Key Topics</label>
              <button
                onClick={addTopic}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add topic
              </button>
            </div>
            <div className="space-y-1.5">
              {keyTopics.map((topic, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  <input
                    value={topic}
                    onChange={(e) => updateTopic(i, e.target.value)}
                    placeholder="Topic name"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={() => removeTopic(i)}
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Minutes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Estimated Minutes</label>
            <input
              type="number"
              min={1}
              max={120}
              value={estimatedMinutes}
              onChange={(e) => { setEstimatedMinutes(parseInt(e.target.value, 10) || 1); markDirty(); }}
              className="w-20 rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Save button */}
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function SyllabusReviewView({ course, onConfirm, onReset, isConfirming }: Props) {
  const courseId = useCourseStore((s) => s.courseId);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Group lessons by module
  const modules = new Map<string, Lesson[]>();
  for (const lesson of course.lessons) {
    const key = lesson.module || 'General';
    if (!modules.has(key)) modules.set(key, []);
    modules.get(key)!.push(lesson);
  }

  const totalMinutes = course.lessons.reduce((sum, l) => sum + l.estimated_minutes, 0);

  return (
    <div className="mx-auto max-w-2xl py-10 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-xs font-medium text-green-600 mb-4">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Syllabus Generated
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Review Your Course Outline</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Click any lesson to edit its title, summary, or topics. When you're happy, confirm to start generating full content.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-6 mb-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" />
          {course.lessons.length} lessons
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          ~{totalMinutes} min
        </span>
        <span className="capitalize">{course.level}</span>
      </div>

      {/* Lesson list grouped by module */}
      <div className="space-y-6 mb-8">
        {Array.from(modules.entries()).map(([moduleName, lessons]) => (
          <div key={moduleName}>
            {modules.size > 1 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                  {moduleName}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.index}
                  lesson={lesson}
                  courseId={courseId!}
                  isExpanded={expandedIdx === lesson.index}
                  onToggle={() => setExpandedIdx(expandedIdx === lesson.index ? null : lesson.index)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onConfirm}
          disabled={isConfirming}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {isConfirming ? 'Starting generation...' : 'Confirm & Generate Course'}
        </button>
        <button
          onClick={onReset}
          disabled={isConfirming}
          className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Start Over
        </button>
      </div>
    </div>
  );
}
