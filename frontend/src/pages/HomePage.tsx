import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, streamCourseGeneration } from '../api/client';
import { CourseGeneratingView } from '../components/course/CourseGeneratingView';
import { DynamicUI } from '../components/DynamicUI';
import { useCourseStore } from '../store/courseStore';
import type { DynamicFormSchema, FormValues } from '../types/dynamic-ui';

const topicSchema: DynamicFormSchema = {
  title: 'Create Your Course',
  description: 'Tell us what you want to learn and we\'ll build a personalized course.',
  fields: [
    {
      id: 'topic',
      type: 'text',
      label: 'Course Topic',
      required: true,
      placeholder: 'e.g., Python decorators, React hooks, Machine Learning...',
    },
    {
      id: 'level',
      type: 'single-choice',
      label: 'Experience Level',
      required: true,
      options: [
        { value: 'beginner', label: 'Beginner', description: 'No prior knowledge' },
        { value: 'intermediate', label: 'Intermediate', description: 'Some familiarity' },
        { value: 'advanced', label: 'Advanced', description: 'Looking to go deeper' },
      ],
    },
    {
      id: 'courseLength',
      type: 'single-choice',
      label: 'Course Length',
      required: true,
      options: [
        { value: 'quick', label: 'Quick (3 lessons)' },
        { value: 'standard', label: 'Standard (6 lessons)' },
        { value: 'deep-dive', label: 'Deep Dive (10 lessons)' },
      ],
    },
    {
      id: 'learningStyle',
      type: 'single-choice',
      label: 'Learning Style',
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
    <div className="mx-auto max-w-2xl py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">DUX Course Platform</h1>
        <p className="text-lg text-muted-foreground">
          AI-powered adaptive learning. Pick any topic and get a personalized course.
        </p>
      </div>
      <DynamicUI schema={topicSchema} onSubmit={handleSubmit} submitLabel="Generate Course" />
    </div>
  );
}
