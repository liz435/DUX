import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Zap } from 'lucide-react';
import { api, streamCourseGeneration } from '../api/client';
import type { CourseSummary } from '../api/client';
import { CourseGeneratingView } from '../components/course/CourseGeneratingView';
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
    isGenerating, generationSteps, error,
    setCourseId, setGenerating, addStep, setCourse, setError, reset,
  } = useCourseStore();
  const [submitted, setSubmitted] = useState(false);
  const [savedCourses, setSavedCourses] = useState<CourseSummary[]>([]);

  useEffect(() => {
    api.listCourses().then(({ courses }) => setSavedCourses(courses)).catch(() => {});
  }, []);

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
            try {
              const { course } = await api.getCourse(course_id);
              setCourse(course);
              navigate(`/courses/${course_id}/lessons/0`);
            } catch {
              setError('Failed to load course after generation.');
            }
          },
          (err) => setError(err.message),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start generation.');
      }
    },
    [navigate, reset, setCourseId, setGenerating, addStep, setCourse, setError],
  );

  if (submitted && (isGenerating || generationSteps.length > 0)) {
    return (
      <CourseGeneratingView
        steps={generationSteps}
        error={error}
        onRetry={() => { setSubmitted(false); reset(); }}
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
                    navigate(`/courses/${c.id}/lessons/0`);
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
