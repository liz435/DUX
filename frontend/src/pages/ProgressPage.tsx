import { CheckCircle, Circle, Lock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useCourseStore } from '../store/courseStore';

export function ProgressPage() {
  const { id } = useParams<{ id: string }>();
  const course = useCourseStore((s) => s.course);

  if (!course) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No course loaded.</p>
        <Link to="/" className="text-primary underline mt-2 inline-block">
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
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>
      </div>

      {/* Overall progress */}
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted">
          <div
            className="h-3 rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {completedCount} of {totalLessons} lessons completed
        </p>
      </div>

      {/* Lesson list */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Lessons</h2>
        {course.lessons.map((lesson) => {
          const Icon = lesson.is_completed
            ? CheckCircle
            : lesson.is_unlocked
              ? Circle
              : Lock;
          return (
            <Link
              key={lesson.index}
              to={
                lesson.is_unlocked
                  ? `/courses/${id}/lessons/${lesson.index}`
                  : '#'
              }
              className={`flex items-center gap-3 rounded-md border p-4 transition-colors ${
                lesson.is_unlocked ? 'hover:bg-muted' : 'opacity-50'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  lesson.is_completed
                    ? 'text-green-500'
                    : lesson.is_unlocked
                      ? 'text-primary'
                      : 'text-muted-foreground'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{lesson.title}</p>
                <p className="text-xs text-muted-foreground">{lesson.summary}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {lesson.estimated_minutes} min
              </span>
            </Link>
          );
        })}
      </div>

      {/* Quiz scores */}
      {course.quizzes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Quizzes</h2>
          {course.quizzes.map((quiz, qi) => (
            <div key={qi} className="flex items-center gap-3 rounded-md border p-4">
              <span className="text-sm font-medium">
                Quiz for Lesson {quiz.lesson_index + 1}
              </span>
              <span className="text-xs text-muted-foreground">
                {quiz.questions.length} questions
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="text-center">
        <Link
          to="/"
          className="text-sm text-primary underline hover:text-primary/80"
        >
          Start a New Course
        </Link>
      </div>
    </div>
  );
}
