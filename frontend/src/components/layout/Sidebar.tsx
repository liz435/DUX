import { BookOpen, CheckCircle, Circle, Lock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useCourseStore } from '../../store/courseStore';

export function Sidebar() {
  const course = useCourseStore((s) => s.course);
  const params = useParams<{ id: string; idx: string }>();
  const currentIdx = params.idx ? parseInt(params.idx, 10) : -1;

  if (!course) {
    return (
      <aside className="hidden w-64 border-r bg-card p-4 lg:block">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold">DUX</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Create a course to see the outline here.
        </p>
      </aside>
    );
  }

  return (
    <aside className="hidden w-64 border-r bg-card p-4 lg:block overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm truncate">{course.title}</span>
      </div>
      <nav className="space-y-1">
        {course.lessons.map((lesson) => {
          const isCurrent = lesson.index === currentIdx;
          const Icon = lesson.is_completed
            ? CheckCircle
            : lesson.is_unlocked
              ? Circle
              : Lock;
          return (
            <Link
              key={lesson.index}
              to={`/courses/${course.id}/lessons/${lesson.index}`}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isCurrent
                  ? 'bg-primary/10 text-primary font-medium'
                  : lesson.is_unlocked
                    ? 'hover:bg-muted'
                    : 'opacity-50 pointer-events-none'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{lesson.title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 border-t pt-4">
        <Link
          to={`/courses/${course.id}/progress`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View Progress
        </Link>
      </div>
    </aside>
  );
}
