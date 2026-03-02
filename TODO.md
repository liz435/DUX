# Agentic Interactive Course App - Implementation Plan

## Vision

Build an interactive, AI-powered course platform where users pick any topic and an
agentic system dynamically generates a full course — lessons, quizzes, coding
exercises, and progress tracking — all rendered through the existing DynamicUI
schema system. The AI agent acts as an adaptive tutor that tailors content based
on user responses and performance.

---

## Phase 1: Foundation — Routing, Layout & State

- [ ] **1.1 Install dependencies**
  - `react-router-dom` for client-side routing
  - `zustand` for lightweight global state management
  - `lucide-react` for icons (already partially used by shadcn)
  - `react-markdown` for rendering AI-generated lesson content

- [ ] **1.2 Set up React Router**
  - Create `src/pages/` directory
  - Pages: `HomePage`, `CourseSetupPage`, `LessonPage`, `QuizPage`, `ProgressPage`
  - Define routes in `App.tsx`:
    - `/` — Home / topic selection
    - `/setup` — Course configuration (depth, pace, style)
    - `/course/:courseId/lesson/:lessonIndex` — Active lesson view
    - `/course/:courseId/quiz/:quizIndex` — Quiz view
    - `/course/:courseId/progress` — Progress dashboard

- [ ] **1.3 Create app layout shell**
  - `src/components/layout/AppShell.tsx` — sidebar + main content area
  - `src/components/layout/Sidebar.tsx` — course outline nav, progress indicators
  - `src/components/layout/TopBar.tsx` — breadcrumb, course title, settings

- [ ] **1.4 Create Zustand store**
  - `src/store/courseStore.ts`
  - State shape:
    ```
    {
      course: { id, title, description, lessons[], quizzes[] } | null,
      currentLessonIndex: number,
      progress: { completedLessons: Set, quizScores: Map, totalScore },
      userProfile: { topic, level, preferences },
      isGenerating: boolean
    }
    ```

---

## Phase 2: Topic Selection & Course Generation Agent

- [ ] **2.1 Build the Home / Topic Selection page**
  - Hero section with app title and description
  - Use `DynamicUI` with a schema containing:
    - `text` field for course topic (e.g., "Rust programming", "Machine Learning")
    - `single-choice` for experience level (Beginner / Intermediate / Advanced)
    - `single-choice` for course length (Quick: 3 lessons, Standard: 6, Deep Dive: 10)
    - `single-choice` for learning style (Conceptual, Hands-on, Mixed)
  - On submit → navigate to course generation

- [ ] **2.2 Create the Course Generation Agent**
  - `src/agents/courseGeneratorAgent.ts`
  - Agentic function that takes user preferences and produces a structured course outline
  - Output: `CourseSchema` with title, description, and array of lesson outlines
  - Each lesson outline: `{ title, summary, keyTopics[], hasQuiz: boolean }`
  - Uses a mock AI endpoint or structured prompt template for generation
  - Implements retry logic and streaming feedback

- [ ] **2.3 Course generation loading/progress UI**
  - `src/components/course/CourseGeneratingView.tsx`
  - Animated progress indicator showing agent "thinking" steps
  - Display each lesson title as it's generated (streaming effect)
  - Transition to course view when complete

---

## Phase 3: Lesson Rendering & Content Agent

- [ ] **3.1 Create lesson content types**
  - `src/types/course.ts`
  - Types:
    ```
    Course { id, title, description, lessons: Lesson[], quizzes: Quiz[] }
    Lesson { index, title, content: string (markdown), keyPoints: string[],
             interactiveElements: DynamicFormSchema[], isCompleted: boolean }
    Quiz { lessonIndex, questions: QuizQuestion[] }
    QuizQuestion { id, question, type, options?, correctAnswer, explanation }
    ```

- [ ] **3.2 Build the Lesson Page**
  - `src/pages/LessonPage.tsx`
  - Split view: lesson content (markdown rendered) on top
  - Interactive section below using `DynamicUI` for:
    - Knowledge checks (single-choice questions mid-lesson)
    - Reflection prompts (text fields for user notes)
    - Parameter exploration (sliders/numbers for interactive demos)
  - "Mark as Complete" + "Next Lesson" navigation
  - Sidebar highlights current position in course outline

- [ ] **3.3 Create the Lesson Content Agent**
  - `src/agents/lessonContentAgent.ts`
  - Takes lesson outline + user level → generates full lesson markdown
  - Generates 2–3 inline interactive `DynamicFormSchema` elements per lesson
  - Adapts vocabulary and depth to user's selected experience level
  - Streams content progressively so user sees it build up

- [ ] **3.4 Build lesson navigation**
  - Previous / Next lesson buttons
  - Sidebar lesson list with completion checkmarks
  - Lock/unlock logic: next lesson unlocked after current is completed

---

## Phase 4: Quiz System & Assessment Agent

- [ ] **4.1 Build the Quiz Page**
  - `src/pages/QuizPage.tsx`
  - Render quiz entirely through `DynamicUI`:
    - Each question → `single-choice` field with options
    - Some questions → `text` field for short-answer
    - Some questions → `boolean` for true/false
  - Submit button triggers grading

- [ ] **4.2 Create the Quiz Generation Agent**
  - `src/agents/quizGeneratorAgent.ts`
  - Input: lesson content + key points → output: array of `QuizQuestion`
  - Generates 4–6 questions per lesson quiz
  - Mix of multiple choice, true/false, and short answer
  - Includes correct answers and explanations

- [ ] **4.3 Build quiz results view**
  - `src/components/course/QuizResults.tsx`
  - Score display with percentage and pass/fail indicator
  - Per-question breakdown: user answer vs correct answer + explanation
  - "Retry Quiz" or "Continue to Next Lesson" options
  - Update progress store with score

---

## Phase 5: Adaptive Tutor Agent & Feedback Loop

- [ ] **5.1 Create the Tutor Agent**
  - `src/agents/tutorAgent.ts`
  - Monitors quiz scores and lesson interaction patterns
  - If user scores < 70% on a quiz → generates supplementary content:
    - Simpler explanations of weak topics
    - Additional practice questions
  - If user scores > 90% → offers advanced bonus content or challenge questions
  - Provides encouraging feedback messages between lessons

- [ ] **5.2 Build the feedback/hint system**
  - `src/components/course/TutorFeedback.tsx`
  - Appears between lessons as an AI "tutor message" card
  - Uses DynamicUI for optional interactive follow-up:
    - "Would you like to review [topic]?" (boolean)
    - "Rate your confidence on this topic" (slider 1–10)
  - Tutor adapts next lesson generation based on responses

---

## Phase 6: Progress Dashboard

- [ ] **6.1 Build the Progress Page**
  - `src/pages/ProgressPage.tsx`
  - Overall completion percentage bar
  - Per-lesson completion status (completed / in-progress / locked)
  - Quiz scores chart or table
  - Time spent indicator (track with store)
  - Key topics mastered vs needing review

- [ ] **6.2 Add progress persistence**
  - Save course state to `localStorage` via Zustand middleware
  - Auto-resume on return: detect saved course and offer to continue
  - Option to reset/start new course

---

## Phase 7: Polish & Integration

- [ ] **7.1 Responsive design pass**
  - Mobile-friendly sidebar (collapsible drawer)
  - Lesson content readable on all screen sizes
  - Quiz layout stacks properly on small screens

- [ ] **7.2 Dark mode support**
  - Leverage existing shadcn dark mode CSS variables
  - Add theme toggle in TopBar
  - Persist preference in localStorage

- [ ] **7.3 Error handling & edge cases**
  - Agent generation failure → retry with fallback
  - Empty/invalid course data → graceful error display
  - Network offline → show cached content where available

- [ ] **7.4 Demo mode with pre-built course**
  - Ship one complete pre-generated course (e.g., "Intro to TypeScript")
  - Allows the app to work without an AI backend
  - Useful for showcasing the UI and interaction patterns

---

## Architecture Overview

```
src/
├── agents/                    # Agentic AI functions
│   ├── courseGeneratorAgent.ts # Generates course outline from topic
│   ├── lessonContentAgent.ts  # Generates full lesson content
│   ├── quizGeneratorAgent.ts  # Generates quiz questions
│   └── tutorAgent.ts          # Adaptive feedback agent
├── components/
│   ├── layout/                # App shell, sidebar, topbar
│   ├── course/                # Course-specific UI components
│   ├── fields/                # (existing) form field components
│   └── ui/                    # (existing) shadcn primitives
├── pages/                     # Route-level page components
│   ├── HomePage.tsx
│   ├── CourseSetupPage.tsx
│   ├── LessonPage.tsx
│   ├── QuizPage.tsx
│   └── ProgressPage.tsx
├── store/
│   └── courseStore.ts         # Zustand global state
├── types/
│   ├── dynamic-ui.ts          # (existing) form types
│   └── course.ts              # Course, Lesson, Quiz types
├── examples/                  # (existing) + demo course data
└── lib/
    └── utils.ts               # (existing) utilities
```

## Key Design Decisions

1. **DynamicUI as the interaction layer** — All user interactions (topic selection,
   knowledge checks, quizzes, tutor feedback) flow through the existing `DynamicUI`
   component with generated schemas. This keeps the architecture consistent and
   showcases the library's power.

2. **Agent pattern** — Each agent is a standalone async function that takes structured
   input and returns structured output. Agents compose: the course generator calls
   the lesson agent, which informs the quiz agent. The tutor agent wraps around all
   of them to adapt the experience.

3. **Progressive generation** — Content is generated on-demand (lesson by lesson),
   not all at once. This keeps the app responsive and allows the tutor agent to
   adapt based on user performance.

4. **Offline-first demo** — A pre-built course ships with the app so it works
   without AI backend, making it easy to demo and develop against.
