import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/client';
import type { AgentStep, Course } from '../api/client';

interface CourseState {
  course: Course | null;
  courseId: string | null;
  isGenerating: boolean;
  generationSteps: AgentStep[];
  error: string | null;

  setCourse: (course: Course) => void;
  setCourseId: (id: string) => void;
  setGenerating: (v: boolean) => void;
  addStep: (step: AgentStep) => void;
  setError: (err: string | null) => void;
  markLessonComplete: (idx: number) => void;
  reset: () => void;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set) => ({
      course: null,
      courseId: null,
      isGenerating: false,
      generationSteps: [],
      error: null,

      setCourse: (course) => set({ course, isGenerating: false }),
      setCourseId: (courseId) => set({ courseId }),
      setGenerating: (isGenerating) => set({ isGenerating, generationSteps: isGenerating ? [] : undefined as unknown as AgentStep[] }),
      addStep: (step) =>
        set((s) => ({ generationSteps: [...s.generationSteps, step] })),
      setError: (error) => set({ error, isGenerating: false }),
      markLessonComplete: (idx) =>
        set((s) => {
          if (!s.course) return {};
          // Persist to backend (fire-and-forget)
          if (s.courseId) {
            api.updateLesson(s.courseId, idx, { is_completed: true }).catch(() => {});
          }
          const lessons = s.course.lessons.map((l) => {
            if (l.index === idx) return { ...l, is_completed: true };
            if (l.index === idx + 1) return { ...l, is_unlocked: true };
            return l;
          });
          return { course: { ...s.course, lessons } };
        }),
      reset: () =>
        set({
          course: null,
          courseId: null,
          isGenerating: false,
          generationSteps: [],
          error: null,
        }),
    }),
    { name: 'dux-course-store' },
  ),
);
