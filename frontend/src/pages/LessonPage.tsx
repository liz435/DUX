import { ArrowLeft, ArrowRight, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { InteractiveCheck } from '../components/InteractiveCheck';
import { useCourseStore } from '../store/courseStore';
import type { DynamicFormSchema } from '../types/dynamic-ui';
import type { Components } from 'react-markdown';

export function LessonPage() {
  const { id, idx } = useParams<{ id: string; idx: string }>();
  const navigate = useNavigate();
  const course = useCourseStore((s) => s.course);
  const courseId = useCourseStore((s) => s.courseId);
  const setCourse = useCourseStore((s) => s.setCourse);
  const setCourseId = useCourseStore((s) => s.setCourseId);
  const markLessonComplete = useCourseStore((s) => s.markLessonComplete);
  const [loading, setLoading] = useState(false);
  const [generateFailed, setGenerateFailed] = useState<number | null>(null);

  const lessonIdx = parseInt(idx ?? '0', 10);
  const lesson = course?.lessons.find((l) => l.index === lessonIdx);

  // Deep-link: fetch course from API if not in store or mismatched
  useEffect(() => {
    if (id && (!course || courseId !== id)) {
      setLoading(true);
      api.getCourse(id)
        .then(({ course }) => {
          setCourse(course);
          setCourseId(id);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, course, courseId, setCourse, setCourseId]);

  // Reset generate failure state when navigating to a different lesson
  useEffect(() => {
    setGenerateFailed(null);
  }, [lessonIdx]);

  // Generate lesson content on demand if missing, and update store with result
  useEffect(() => {
    if (id && course && courseId === id && generateFailed !== lessonIdx && !course.lessons.find(l => l.index === lessonIdx)?.content) {
      api.generateLesson(id, lessonIdx)
        .then(({ lesson: generated }) => {
          const updatedLessons = course.lessons.map((l) =>
            l.index === generated.index ? { ...l, ...generated } : l
          );
          setCourse({ ...course, lessons: updatedLessons });
        })
        .catch(() => {
          setGenerateFailed(lessonIdx);
        });
    }
  }, [id, lessonIdx, course, courseId, setCourse, generateFailed]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course || !lesson) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Course or lesson not found.</p>
        <Link to="/" className="text-primary underline mt-2 inline-block text-sm">
          Go Home
        </Link>
      </div>
    );
  }

  const prevIdx = lessonIdx > 0 ? lessonIdx - 1 : null;
  const nextIdx = lessonIdx < course.lessons.length - 1 ? lessonIdx + 1 : null;
  const hasQuiz = course.quizzes.some((q) => q.lesson_index === lessonIdx);

  const handleComplete = () => {
    markLessonComplete(lessonIdx);
    if (hasQuiz) {
      const quizIdx = course.quizzes.findIndex((q) => q.lesson_index === lessonIdx);
      if (quizIdx >= 0) navigate(`/courses/${id}/quizzes/${quizIdx}`);
    } else if (nextIdx !== null) {
      navigate(`/courses/${id}/lessons/${nextIdx}`);
    } else {
      navigate(`/courses/${id}/progress`);
    }
  };

  const moduleName = lesson.module || 'General';

  // Custom markdown components for clean section typography
  const mdComponents: Components = useMemo(() => ({
    h2: ({ children, ...props }) => (
      <h2
        className="text-2xl font-bold tracking-tight text-foreground mt-12 mb-4 pb-2 border-b border-border first:mt-0"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="text-lg font-semibold text-foreground mt-8 mb-3"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="text-base font-semibold text-foreground mt-6 mb-2"
        {...props}
      >
        {children}
      </h4>
    ),
    p: ({ children, ...props }) => (
      <p className="text-[15px] leading-[1.8] text-foreground/90 mb-4" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="my-4 ml-1 space-y-2 text-[15px] leading-[1.8] text-foreground/90 list-disc pl-5" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="my-4 ml-1 space-y-2 text-[15px] leading-[1.8] text-foreground/90 list-decimal pl-5" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="pl-1" {...props}>{children}</li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="my-6 border-l-4 border-primary/30 bg-primary/5 rounded-r-lg px-5 py-4 text-[15px] leading-[1.8] text-foreground/80 [&>p]:mb-0"
        {...props}
      >
        {children}
      </blockquote>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-foreground" {...props}>{children}</strong>
    ),
    code: ({ children, className, ...props }) => {
      if (!className) {
        return (
          <code
            className="rounded-md bg-secondary px-1.5 py-0.5 text-[13px] font-mono text-primary"
            {...props}
          >
            {children}
          </code>
        );
      }
      return <code className={className} {...props}>{children}</code>;
    },
    pre: ({ children, ...props }) => (
      <pre
        className="my-6 overflow-x-auto rounded-xl border border-border bg-card p-5 text-[13px] leading-relaxed"
        {...props}
      >
        {children}
      </pre>
    ),
    hr: () => <hr className="my-10 border-border" />,
    table: ({ children, ...props }) => (
      <div className="my-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm" {...props}>{children}</table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th className="bg-muted/50 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border-t border-border px-4 py-2.5 text-sm" {...props}>
        {children}
      </td>
    ),
  }), []);

  return (
    <div className="mx-auto max-w-3xl pb-12">
      {/* Lesson header */}
      <div className="mb-10 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{moduleName}</span>
          <span className="text-muted-foreground/40">›</span>
          <span className="font-semibold text-primary">Lesson {lessonIdx + 1}</span>
          <span>/</span>
          <span>{course.lessons.length}</span>
          {lesson.estimated_minutes && (
            <>
              <span>·</span>
              <Clock className="h-3 w-3" />
              <span>{lesson.estimated_minutes} min</span>
            </>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">{lesson.title}</h1>
        {lesson.summary && (
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">{lesson.summary}</p>
        )}
      </div>

      {/* Lesson content with inline interactive checks */}
      <article className="mb-10">
        {(() => {
          const blocks = lesson.content_blocks || [];

      {/* Interactive checks */}
      {lesson.interactive_elements.length > 0 && (
        <div className="space-y-6 mb-10">
          {lesson.interactive_elements.map((schema, i) => (
            <InteractiveCheck
              key={i}
              schema={schema as unknown as DynamicFormSchema}
              courseId={id!}
              lessonIdx={lessonIdx}
              elementIdx={i}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {prevIdx !== null && (
            <Link
              to={`/courses/${id}/lessons/${prevIdx}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Link>
          )}
        </div>
        <button
          onClick={handleComplete}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          {lesson.is_completed ? (
            <>
              <CheckCircle className="h-4 w-4" />
              {nextIdx !== null ? 'Next Lesson' : 'View Progress'}
            </>
          ) : (
            <>
              Mark Complete{hasQuiz ? ' & Take Quiz' : nextIdx !== null ? ' & Next' : ' & Finish'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <div>
          {nextIdx !== null && !hasQuiz && (
            <Link
              to={`/courses/${id}/lessons/${nextIdx}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
