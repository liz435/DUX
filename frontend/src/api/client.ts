const API_BASE = '/api';

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json();
}

export interface CourseSummary {
  id: string;
  title: string;
  topic: string;
  level: string;
  lesson_count: number;
  completed_count: number;
  created_at: string;
}

export const api = {
  listCourses: () =>
    request<{ courses: CourseSummary[] }>('/courses'),

  createCourse: (preferences: {
    topic: string;
    level: string;
    course_length: string;
    learning_style: string;
  }) =>
    request<{ course_id: string; status: string }>('/courses', {
      method: 'POST',
      body: JSON.stringify({ preferences }),
    }),

  getCourse: (courseId: string) =>
    request<{ course: Course }>(`/courses/${courseId}`),

  updateLesson: (courseId: string, lessonIdx: number, data: { is_completed?: boolean }) =>
    request<{ lesson: Lesson }>(`/courses/${courseId}/lessons/${lessonIdx}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  generateLesson: (courseId: string, lessonIdx: number) =>
    request<{ lesson: Lesson }>(`/courses/${courseId}/lessons/${lessonIdx}/generate`, {
      method: 'POST',
    }),

  generateQuiz: (courseId: string, quizIdx: number) =>
    request<{ quiz: Quiz }>(`/courses/${courseId}/quizzes/${quizIdx}/generate`, {
      method: 'POST',
    }),

  gradeQuiz: (courseId: string, quizIdx: number, answers: Record<string, string>) =>
    request<GradeResult>(`/courses/${courseId}/quizzes/${quizIdx}/grade`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  updateLessonOutline: (courseId: string, lessonIdx: number, data: LessonOutlineUpdate) =>
    request<{ course: Course }>(`/courses/${courseId}/outline/${lessonIdx}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  confirmCourse: (courseId: string) =>
    request<{ course_id: string }>(`/courses/${courseId}/confirm`, {
      method: 'POST',
    }),

  submitFeedback: (courseId: string, data: { lesson_index: number; interaction_type: string; data: Record<string, unknown> }) =>
    request<{ message: string; adaptations: Record<string, unknown> }>(
      `/courses/${courseId}/feedback`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  checkInteractiveAnswer: (
    courseId: string,
    lessonIdx: number,
    elementIdx: number,
    answers: Record<string, any>,
  ) =>
    request<CheckInteractiveResponse>(
      `/courses/${courseId}/lessons/${lessonIdx}/check/${elementIdx}`,
      {
        method: 'POST',
        body: JSON.stringify({ lesson_index: lessonIdx, element_index: elementIdx, answers }),
      },
    ),
};

export function streamCourseGeneration(
  courseId: string,
  onEvent: (event: AgentStep) => void,
  onDone: () => void,
  onError: (err: Error) => void,
) {
  const source = new EventSource(`${API_BASE}/courses/${courseId}/stream`);
  let closed = false;

  const handleEvent = (e: MessageEvent) => {
    try {
      const step: AgentStep = JSON.parse(e.data);
      onEvent({ ...step, type: e.type as AgentStep['type'] });
    } catch {
      // ignore parse errors
    }
  };

  const handleDone = () => {
    if (closed) return;
    closed = true;
    source.close();
    onDone();
  };

  const eventTypes = [
    'planning', 'outline_ready', 'awaiting_confirmation', 'generating_lesson',
    'lesson_ready', 'generating_quiz', 'quiz_ready', 'tutor_feedback', 'complete', 'error',
  ];
  eventTypes.forEach(t => source.addEventListener(t, handleEvent));

  source.addEventListener('complete', handleDone);
  source.addEventListener('awaiting_confirmation', handleDone);

  source.addEventListener('error', () => {
    if (closed) return;
    closed = true;
    source.close();
    onError(new Error('SSE connection lost'));
  });

  return () => {
    closed = true;
    source.close();
  };
}

// Types matching backend schemas
export interface AgentStep {
  type: 'planning' | 'outline_ready' | 'awaiting_confirmation' | 'generating_lesson' |
    'lesson_ready' | 'generating_quiz' | 'quiz_ready' | 'tutor_feedback' | 'complete' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

export interface LessonOutlineUpdate {
  title?: string;
  summary?: string;
  key_topics?: string[];
  estimated_minutes?: number;
  difficulty?: number;
  module?: string;
}

export interface Lesson {
  index: number;
  title: string;
  summary: string;
  key_topics: string[];
  has_quiz: boolean;
  estimated_minutes: number;
  module: string;
  difficulty: number;
  prerequisites: number[];
  learning_objectives: Record<string, string>[];
  key_terms: string[];
  content: string;
  interactive_elements: Record<string, unknown>[];
  is_completed: boolean;
  is_unlocked: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  question_type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: { value: string; label: string }[];
  correct_answer: string;
  explanation: string;
}

export interface Quiz {
  lesson_index: number;
  questions: QuizQuestion[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  topic: string;
  level: string;
  lessons: Lesson[];
  quizzes: Quiz[];
  created_at: string;
}

export interface GradeResult {
  score: number;
  total_questions: number;
  correct_count: number;
  results: {
    question_id: string;
    correct: boolean;
    user_answer: string;
    correct_answer: string;
    explanation: string;
  }[];
}

export interface CheckInteractiveResponse {
  correct: boolean;
  score: number;
  correct_answer: Record<string, any>;
  explanation: string;
  feedback: string;
}
