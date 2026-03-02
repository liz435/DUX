import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { DynamicUI } from '../components/DynamicUI';
import { useCourseStore } from '../store/courseStore';
import type { DynamicFormSchema } from '../types/dynamic-ui';

export function LessonPage() {
  const { id, idx } = useParams<{ id: string; idx: string }>();
  const navigate = useNavigate();
  const course = useCourseStore((s) => s.course);
  const markLessonComplete = useCourseStore((s) => s.markLessonComplete);

  const lessonIdx = parseInt(idx ?? '0', 10);
  const lesson = course?.lessons.find((l) => l.index === lessonIdx);

  useEffect(() => {
    if (id && course && !course.lessons.find(l => l.index === lessonIdx)?.content) {
      api.generateLesson(id, lessonIdx).catch(() => {});
    }
  }, [id, lessonIdx, course]);

  if (!course || !lesson) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Course or lesson not found.</p>
        <Link to="/" className="text-primary underline mt-2 inline-block">
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
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          Lesson {lessonIdx + 1} of {course.lessons.length}
        </p>
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        <p className="text-muted-foreground mt-1">{lesson.summary}</p>
      </div>

      <article className="prose prose-slate dark:prose-invert max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{lesson.content}</Markdown>
      </article>

      {lesson.interactive_elements.map((schema, i) => (
        <div key={i} className="border rounded-lg p-4">
          <DynamicUI
            schema={schema as unknown as DynamicFormSchema}
            onSubmit={() => {}}
            submitLabel="Check"
          />
        </div>
      ))}

      <div className="flex items-center justify-between border-t pt-6">
        <div>
          {prevIdx !== null && (
            <Link
              to={`/courses/${id}/lessons/${prevIdx}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </Link>
          )}
        </div>
        <button
          onClick={handleComplete}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {lesson.is_completed ? (
            <>
              <CheckCircle className="h-4 w-4" />
              {nextIdx !== null ? 'Next Lesson' : 'View Progress'}
            </>
          ) : (
            <>
              Mark Complete & {hasQuiz ? 'Take Quiz' : nextIdx !== null ? 'Next' : 'Finish'}
            </>
          )}
        </button>
        <div>
          {nextIdx !== null && !hasQuiz && (
            <Link
              to={`/courses/${id}/lessons/${nextIdx}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
