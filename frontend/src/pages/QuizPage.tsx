import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api, type GradeResult } from '../api/client';
import { DynamicUI } from '../components/DynamicUI';
import { QuizResults } from '../components/course/QuizResults';
import { useCourseStore } from '../store/courseStore';
import type { DynamicFormSchema, FormValues } from '../types/dynamic-ui';

export function QuizPage() {
  const { id, idx } = useParams<{ id: string; idx: string }>();
  const navigate = useNavigate();
  const course = useCourseStore((s) => s.course);
  const courseId = useCourseStore((s) => s.courseId);
  const setCourse = useCourseStore((s) => s.setCourse);
  const setCourseId = useCourseStore((s) => s.setCourseId);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const quizIdx = parseInt(idx ?? '0', 10);
  const quiz = course?.quizzes[quizIdx];

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading quiz...</p>
      </div>
    );
  }

  if (!course || !quiz) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Quiz not found.</p>
        <Link to="/" className="text-primary underline mt-2 inline-block">
          Go Home
        </Link>
      </div>
    );
  }

  const quizSchema: DynamicFormSchema = {
    title: `Quiz: Lesson ${quiz.lesson_index + 1}`,
    description: `Answer the following ${quiz.questions.length} questions.`,
    fields: quiz.questions.map((q) => {
      if (q.question_type === 'multiple-choice' && q.options) {
        return {
          id: q.id,
          type: 'single-choice' as const,
          label: q.question,
          required: true,
          options: q.options.map((o) => ({ value: o.value, label: o.label })),
        };
      }
      if (q.question_type === 'true-false') {
        return {
          id: q.id,
          type: 'single-choice' as const,
          label: q.question,
          required: true,
          options: [
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' },
          ],
        };
      }
      return {
        id: q.id,
        type: 'text' as const,
        label: q.question,
        required: true,
        placeholder: 'Type your answer...',
      };
    }),
  };

  const handleSubmit = async (values: FormValues) => {
    if (!id) return;
    setGrading(true);
    try {
      const answers: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) {
        answers[k] = String(v ?? '');
      }
      const res = await api.gradeQuiz(id, quizIdx, answers);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setGrading(false);
    }
  };

  const nextLessonIdx = quiz.lesson_index + 1;
  const hasNext = course.lessons.some((l) => l.index === nextLessonIdx);

  if (result) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <QuizResults
          result={result}
          onRetry={() => setResult(null)}
          onContinue={() => {
            if (hasNext) {
              navigate(`/courses/${id}/lessons/${nextLessonIdx}`);
            } else {
              navigate(`/courses/${id}/progress`);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <DynamicUI
        schema={quizSchema}
        onSubmit={handleSubmit}
        submitLabel={grading ? 'Grading...' : 'Submit Answers'}
      />
    </div>
  );
}
