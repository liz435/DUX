import { ArrowLeft, ArrowRight, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { InteractiveCheck } from '../components/InteractiveCheck';
import { useCourseStore } from '../store/courseStore';
import type { DynamicFormSchema } from '../types/dynamic-ui';

export function LessonPage() {
  const { id, idx } = useParams<{ id: string; idx: string }>();
  const navigate = useNavigate();
  const course = useCourseStore((s) => s.course);
  const courseId = useCourseStore((s) => s.courseId);
  const setCourse = useCourseStore((s) => s.setCourse);
  const setCourseId = useCourseStore((s) => s.setCourseId);
  const markLessonComplete = useCourseStore((s) => s.markLessonComplete);
  const [loading, setLoading] = useState(false);

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

  // Generate lesson content on demand if missing, and update store with result
  useEffect(() => {
    if (id && course && courseId === id && !course.lessons.find(l => l.index === lessonIdx)?.content) {
      api.generateLesson(id, lessonIdx)
        .then(({ lesson: generated }) => {
          const updatedLessons = course.lessons.map((l) =>
            l.index === generated.index ? { ...l, ...generated } : l
          );
          setCourse({ ...course, lessons: updatedLessons });
        })
        .catch(() => {});
    }
  }, [id, lessonIdx, course, courseId, setCourse]);

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

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
        <h1 className="text-2xl font-bold leading-tight">{lesson.title}</h1>
        {lesson.summary && (
          <p className="text-muted-foreground text-sm leading-relaxed">{lesson.summary}</p>
        )}
      </div>

      <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-code:text-primary prose-pre:rounded-xl prose-pre:border">
        <Markdown remarkPlugins={[remarkGfm]}>{lesson.content}</Markdown>
      </article>

      {lesson.interactive_elements.map((schema, i) => (
        <InteractiveCheck
          key={i}
          schema={schema as DynamicFormSchema}
          courseId={id!}
          lessonIdx={lessonIdx}
          elementIdx={i}
        />
      ))}

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
