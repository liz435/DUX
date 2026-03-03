import { CheckCircle, Circle, Lock, Loader2, Plus, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useCourseStore } from '../store/courseStore';

export function ProgressPage() {
  const { id } = useParams<{ id: string }>();
  const course = useCourseStore((s) => s.course);
  const courseId = useCourseStore((s) => s.courseId);
  const setCourse = useCourseStore((s) => s.setCourse);
  const setCourseId = useCourseStore((s) => s.setCourseId);
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

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground mb-4">No course loaded.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create a Course
        </Link>
      </div>
    );
  }

  const completedCount = course.lessons.filter((l) => l.is_completed).length;
  const totalLessons = course.lessons.length;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Overall Progress</p>
            <p className="text-xs text-muted-foreground">
              {completedCount} of {totalLessons} lessons completed
            </p>
          </div>
          <span className="text-2xl font-bold text-primary tabular-nums">{pct}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold mb-3">Lessons</h2>
        <div className="space-y-2">
          {course.lessons.map((lesson) => {
            const Icon = lesson.is_completed ? CheckCircle : lesson.is_unlocked ? Circle : Lock;
            return (
              <Link
                key={lesson.index}
                to={lesson.is_unlocked ? `/courses/${id}/lessons/${lesson.index}` : '#'}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all ${
                  lesson.is_unlocked
                    ? 'hover:bg-muted/50 hover:border-primary/30'
                    : 'opacity-50 pointer-events-none'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    lesson.is_completed
                      ? 'text-green-500'
                      : lesson.is_unlocked
                        ? 'text-primary'
                        : 'text-muted-foreground'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{lesson.summary}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {lesson.estimated_minutes}m
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {course.quizzes.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Quizzes</h2>
          <div className="space-y-2">
            {course.quizzes.map((quiz, qi) => (
              <div key={qi} className="flex items-center gap-3 rounded-xl border px-4 py-3.5">
                <div className="flex-1">
                  <p className="text-sm font-medium">Quiz for Lesson {quiz.lesson_index + 1}</p>
                  <p className="text-xs text-muted-foreground">{quiz.questions.length} questions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          Start a new course
        </Link>
      </div>
    </div>
  );
}
