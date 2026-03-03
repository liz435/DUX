import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Zap } from 'lucide-react';
import { api, streamCourseGeneration } from '../api/client';
import type { CourseSummary } from '../api/client';
import { CourseGeneratingView } from '../components/course/CourseGeneratingView';
import { SyllabusReviewView } from '../components/course/SyllabusReviewView';
import { DynamicUI } from '../components/DynamicUI';
import { useCourseStore } from '../store/courseStore';
import type { DynamicFormSchema, FormValues } from '../types/dynamic-ui';

const topicSchema: DynamicFormSchema = {
  fields: [
    {
      id: 'topic',
      type: 'text',
      label: 'What do you want to learn?',
      required: true,
      placeholder: 'e.g., Python decorators, React hooks, Machine Learning...',
    },
    {
      id: 'level',
      type: 'single-choice',
      label: 'Your experience level',
      required: true,
      options: [
        { value: 'beginner', label: 'Beginner', description: 'Starting from scratch' },
        { value: 'intermediate', label: 'Intermediate', description: 'Some familiarity' },
        { value: 'advanced', label: 'Advanced', description: 'Going deeper' },
      ],
    },
    {
      id: 'courseLength',
      type: 'single-choice',
      label: 'Course length',
      required: true,
      options: [
        { value: 'quick', label: 'Quick', description: '3 lessons · ~30 min' },
        { value: 'standard', label: 'Standard', description: '6 lessons · ~1 hour' },
        { value: 'deep-dive', label: 'Deep Dive', description: '10 lessons · ~2 hours' },
      ],
    },
    {
      id: 'learningStyle',
      type: 'single-choice',
      label: 'Learning style',
      options: [
        { value: 'conceptual', label: 'Conceptual', description: 'Theory and principles' },
        { value: 'hands-on', label: 'Hands-on', description: 'Code and exercises' },
        { value: 'mixed', label: 'Mixed', description: 'Balance of both' },
      ],
      defaultValue: 'mixed',
    },
  ],
};

export function HomePage() {
  const navigate = useNavigate();
  const {
    course, courseId,
    isGenerating, isAwaitingConfirmation, generationSteps, error,
    setCourseId, setGenerating, setAwaitingConfirmation, addStep, setCourse, setError, reset,
  } = useCourseStore();
  const [submitted, setSubmitted] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [savedCourses, setSavedCourses] = useState<CourseSummary[]>([]);

  useEffect(() => {
    const refresh = () =>
      api.listCourses().then(({ courses }) => setSavedCourses(courses)).catch(() => {});
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  // Phase 1: Submit preferences → generate outline only
  const handleSubmit = useCallback(
    async (values: FormValues) => {
      reset();
      setGenerating(true);
      setSubmitted(true);

      try {
        const { course_id } = await api.createCourse({
          topic: values.topic as string,
          level: values.level as string,
          course_length: values.courseLength as string,
          learning_style: (values.learningStyle as string) || 'mixed',
        });
        setCourseId(course_id);

        streamCourseGeneration(
          course_id,
          (step) => addStep(step),
          async () => {
            // Phase 1 done — fetch the draft course and show syllabus review
            try {
              const { course } = await api.getCourse(course_id);
              setCourse(course);
              setAwaitingConfirmation(true);
              api.listCourses().then(({ courses }) => setSavedCourses(courses)).catch(() => {});
            } catch {
              setError('Failed to load course outline.');
            }
          },
          (err) => setError(err.message),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start generation.');
      }
    },
    [reset, setCourseId, setGenerating, addStep, setCourse, setAwaitingConfirmation, setError],
  );

  // Phase 2: Confirm syllabus → generate full content
  const handleConfirm = useCallback(async () => {
    if (!courseId) return;
    setIsConfirming(true);

    try {
      await api.confirmCourse(courseId);
      setAwaitingConfirmation(false);
      setGenerating(true);

      streamCourseGeneration(
        courseId,
        (step) => addStep(step),
        async () => {
          try {
            const { course } = await api.getCourse(courseId);
            setCourse(course);
            api.listCourses().then(({ courses }) => setSavedCourses(courses)).catch(() => {});
            navigate(`/courses/${courseId}/lessons/0`);
          } catch {
            setError('Failed to load course after generation.');
          }
        },
        (err) => setError(err.message),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm course.');
    } finally {
      setIsConfirming(false);
    }
  }, [courseId, navigate, setAwaitingConfirmation, setGenerating, addStep, setCourse, setError]);

  const handleReset = useCallback(() => {
    setSubmitted(false);
    reset();
  }, [reset]);

  // Syllabus review view (Phase 1 complete, awaiting confirmation)
  if (isAwaitingConfirmation && course) {
    return (
      <SyllabusReviewView
        course={course}
        onConfirm={handleConfirm}
        onReset={handleReset}
        isConfirming={isConfirming}
      />
    );
  }

  // Generation progress view (Phase 1 planning or Phase 2 content)
  if (submitted && (isGenerating || generationSteps.length > 0)) {
    return (
      <CourseGeneratingView
        steps={generationSteps}
        error={error}
        onRetry={handleReset}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-5">
          <Zap className="h-3.5 w-3.5" />
          AI-powered adaptive learning
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Learn anything,{' '}
          <span className="text-primary">your way</span>
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
          Pick a topic, set your preferences, and get a personalized course built just for you.
        </p>
      </div>
      <DynamicUI schema={topicSchema} onSubmit={handleSubmit} submitLabel="Generate Course →" />

      {savedCourses.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5" />
            Your Courses
          </h2>
          <div className="space-y-3">
            {savedCourses.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  api.getCourse(c.id).then(({ course }) => {
                    setCourse(course);
                    setCourseId(c.id);
                    const resumeLesson = course.lessons.find(
                      (l) => l.is_unlocked && !l.is_completed
                    ) ?? course.lessons[course.lessons.length - 1];
                    navigate(`/courses/${c.id}/lessons/${resumeLesson?.index ?? 0}`);
                  });
                }}
                className="w-full text-left rounded-lg border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.topic}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.level} · {c.lesson_count} lessons · {c.completed_count}/{c.lesson_count} completed
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
