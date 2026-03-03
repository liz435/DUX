import { BookOpen, CheckCircle, Circle, Lock, TrendingUp } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useCourseStore } from '../../store/courseStore';

export function Sidebar() {
  const course = useCourseStore((s) => s.course);
  const params = useParams<{ id: string; idx: string }>();
  const currentIdx = params.idx ? parseInt(params.idx, 10) : -1;

  if (!course) {
    return (
      <aside className="hidden w-64 border-r bg-card p-5 lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Course Outline</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Create a course to see the outline here.
        </p>
      </aside>
    );
  }

  const completedCount = course.lessons.filter((l) => l.is_completed).length;
  const pct = Math.round((completedCount / course.lessons.length) * 100);

  return (
    <aside className="hidden w-64 border-r bg-card p-5 lg:flex lg:flex-col overflow-y-auto">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-sm truncate">{course.title}</span>
      </div>

      <div className="mb-4 px-1">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{completedCount}/{course.lessons.length} done</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <nav className="space-y-0.5 flex-1">
        {course.lessons.map((lesson) => {
          const isCurrent = lesson.index === currentIdx;
          const Icon = lesson.is_completed ? CheckCircle : lesson.is_unlocked ? Circle : Lock;
          return (
            <Link
              key={lesson.index}
              to={`/courses/${course.id}/lessons/${lesson.index}`}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all duration-150 ${
                isCurrent
                  ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                  : lesson.is_unlocked
                    ? 'hover:bg-muted text-foreground/80 hover:text-foreground'
                    : 'opacity-40 pointer-events-none text-muted-foreground'
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${
                  isCurrent
                    ? 'text-primary-foreground'
                    : lesson.is_completed
                      ? 'text-green-500'
                      : ''
                }`}
              />
              <span className="truncate leading-snug">{lesson.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 pt-4 border-t">
        <Link
          to={`/courses/${course.id}/progress`}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          View Progress
        </Link>
      </div>
    </aside>
  );
}
