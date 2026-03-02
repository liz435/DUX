# Course Generator Agent — Detailed Implementation TODO

## Overview

The Course Generator Agent is the core agentic piece of the app. It takes a user's
topic + preferences from the `DynamicUI` form and orchestrates a multi-step pipeline
to produce a complete, structured `Course` object — ready for the lesson renderer
and quiz system to consume.

---

## Step 1: Define Course Types

**File:** `src/types/course.ts`

- [ ] **1.1 `CoursePreferences` input type**
  ```ts
  interface CoursePreferences {
    topic: string;               // Free-text topic from user
    level: "beginner" | "intermediate" | "advanced";
    courseLength: "quick" | "standard" | "deep-dive";  // 3 / 6 / 10 lessons
    learningStyle: "conceptual" | "hands-on" | "mixed";
  }
  ```

- [ ] **1.2 `LessonOutline` type** (lightweight, generated first)
  ```ts
  interface LessonOutline {
    index: number;
    title: string;
    summary: string;           // 1-2 sentence description
    keyTopics: string[];       // 3-5 bullet points of what the lesson covers
    hasQuiz: boolean;          // Whether this lesson ends with a quiz
    estimatedMinutes: number;  // Rough time estimate for the user
  }
  ```

- [ ] **1.3 `Lesson` type** (full content, generated on-demand later)
  ```ts
  interface Lesson extends LessonOutline {
    content: string;                        // Full markdown body
    interactiveElements: DynamicFormSchema[];// Inline knowledge checks
    isCompleted: boolean;
    isUnlocked: boolean;
  }
  ```

- [ ] **1.4 `QuizQuestion` type**
  ```ts
  interface QuizQuestion {
    id: string;
    question: string;
    type: "multiple-choice" | "true-false" | "short-answer";
    options?: Array<{ value: string; label: string }>;
    correctAnswer: string;
    explanation: string;
  }
  ```

- [ ] **1.5 `Quiz` type**
  ```ts
  interface Quiz {
    lessonIndex: number;
    questions: QuizQuestion[];
  }
  ```

- [ ] **1.6 `Course` type** (the top-level object the agent produces)
  ```ts
  interface Course {
    id: string;
    title: string;
    description: string;
    topic: string;
    level: CoursePreferences["level"];
    lessons: Lesson[];
    quizzes: Quiz[];
    createdAt: number;         // timestamp
  }
  ```

- [ ] **1.7 `AgentStatus` type** (for streaming progress to the UI)
  ```ts
  type AgentStep =
    | { type: "planning"; message: string }
    | { type: "outline-ready"; lessonCount: number }
    | { type: "generating-lesson"; lessonIndex: number; title: string }
    | { type: "lesson-ready"; lessonIndex: number }
    | { type: "generating-quiz"; lessonIndex: number }
    | { type: "complete"; course: Course }
    | { type: "error"; message: string };
  ```

---

## Step 2: Build the Prompt Templates

**File:** `src/agents/prompts/coursePrompts.ts`

- [ ] **2.1 `buildOutlinePrompt(prefs: CoursePreferences): string`**
  - System prompt establishing the agent as a curriculum designer
  - Instructs the model to output a JSON array of `LessonOutline` objects
  - Includes constraints derived from preferences:
    - `courseLength` → exact number of lessons (3 / 6 / 10)
    - `level` → vocabulary complexity and depth
    - `learningStyle` → ratio of theory to exercises
  - Provides a one-shot JSON example for reliable structured output
  - Specifies that lessons should build on each other progressively

- [ ] **2.2 `buildLessonContentPrompt(outline: LessonOutline, prefs: CoursePreferences, prevLessons: string[]): string`**
  - Generates a single lesson's full markdown content
  - Includes context from previous lesson titles to maintain continuity
  - Instructs model to include 2-3 placeholder markers (`{{INTERACTIVE:id}}`)
    where inline DynamicUI elements should be inserted
  - Level-aware: beginner gets more analogies, advanced gets more depth

- [ ] **2.3 `buildQuizPrompt(lesson: LessonOutline, level: string): string`**
  - Generates 4-6 quiz questions for a given lesson
  - Output: JSON array of `QuizQuestion` objects
  - Mix of question types based on lesson content
  - Each question includes an explanation field

- [ ] **2.4 `buildInteractiveElementPrompt(lessonContent: string, marker: string): string`**
  - Takes a lesson and a specific `{{INTERACTIVE:id}}` marker
  - Generates a `DynamicFormSchema` for that checkpoint
  - Produces knowledge-check questions, reflection prompts, or parameter
    exploration widgets depending on the surrounding content context

---

## Step 3: Implement the Agent Core

**File:** `src/agents/courseGeneratorAgent.ts`

- [ ] **3.1 Create `generateCourseOutline()` function**
  ```ts
  async function generateCourseOutline(
    prefs: CoursePreferences,
    onStep: (step: AgentStep) => void
  ): Promise<LessonOutline[]>
  ```
  - Calls the outline prompt
  - Parses and validates JSON response with Zod schema
  - Emits `planning` and `outline-ready` agent steps
  - Returns validated array of `LessonOutline`
  - On parse failure: retry once with a stricter prompt, then fall back to
    the demo course data

- [ ] **3.2 Create `generateLessonContent()` function**
  ```ts
  async function generateLessonContent(
    outline: LessonOutline,
    prefs: CoursePreferences,
    previousLessonTitles: string[],
    onStep: (step: AgentStep) => void
  ): Promise<Lesson>
  ```
  - Calls the lesson content prompt
  - Parses markdown response, extracts `{{INTERACTIVE:*}}` markers
  - For each marker: calls `generateInteractiveElement()` to get a
    `DynamicFormSchema`
  - Assembles final `Lesson` with content + interactive elements
  - Emits `generating-lesson` and `lesson-ready` steps

- [ ] **3.3 Create `generateQuiz()` function**
  ```ts
  async function generateQuiz(
    outline: LessonOutline,
    level: string,
    onStep: (step: AgentStep) => void
  ): Promise<Quiz>
  ```
  - Calls the quiz prompt
  - Parses and validates JSON with Zod
  - Emits `generating-quiz` step
  - Returns validated `Quiz`

- [ ] **3.4 Create `generateInteractiveElement()` function**
  ```ts
  async function generateInteractiveElement(
    lessonContent: string,
    marker: string
  ): Promise<DynamicFormSchema>
  ```
  - Calls the interactive element prompt
  - Validates output against `DynamicFormSchema` type
  - Returns a schema usable directly by `<DynamicUI />`

- [ ] **3.5 Create the top-level orchestrator `generateCourse()`**
  ```ts
  async function generateCourse(
    prefs: CoursePreferences,
    onStep: (step: AgentStep) => void
  ): Promise<Course>
  ```
  - **Step A**: Generate outline → get `LessonOutline[]`
  - **Step B**: Generate first lesson content immediately (so user can start)
  - **Step C**: Generate quiz for first lesson (if `hasQuiz`)
  - **Step D**: Return partial `Course` with first lesson hydrated,
    remaining lessons as outlines only (lazy generation)
  - Emits `complete` step with the initial course object
  - Remaining lessons generated on-demand when user navigates to them

---

## Step 4: Zod Validation Schemas

**File:** `src/agents/validation/courseSchemas.ts`

- [ ] **4.1 `lessonOutlineSchema`** — validates AI output for outlines
  - Ensures `index` is sequential, `title` and `summary` are non-empty strings
  - `keyTopics` array has 3-5 items
  - `hasQuiz` is boolean

- [ ] **4.2 `quizQuestionSchema`** — validates each quiz question
  - `type` is one of the allowed enum values
  - If `type === "multiple-choice"`, `options` array must have 3-4 items
  - `correctAnswer` matches one of the option values (or is a string for short-answer)
  - `explanation` is non-empty

- [ ] **4.3 `dynamicFormSchemaValidator`** — validates generated `DynamicFormSchema`
  - Each field has a valid `type` from the union
  - Required sub-fields present per type (e.g., `slider` has `min`/`max`)
  - No duplicate `id` values across fields

---

## Step 5: AI Provider Abstraction

**File:** `src/agents/providers/aiProvider.ts`

- [ ] **5.1 Define `AIProvider` interface**
  ```ts
  interface AIProvider {
    complete(prompt: string, options?: { temperature?: number }): Promise<string>;
    stream(prompt: string, onChunk: (chunk: string) => void): Promise<string>;
  }
  ```

- [ ] **5.2 Implement `MockAIProvider`** (for demo/development)
  - Returns pre-defined responses from a template bank
  - Simulates streaming with `setTimeout` chunking
  - Supports 3-4 topics with pre-authored outlines
  - Falls back to a generic template for unknown topics
  - This is the **default provider** so the app works without API keys

- [ ] **5.3 Implement `VercelAIProvider`** (for real AI backend)
  - Wraps the Vercel AI SDK (`ai` package) already in dependencies
  - Uses `generateText()` / `streamText()` from the SDK
  - Configurable model selection and API endpoint
  - Handles rate limiting and error retries (exponential backoff, max 3)

- [ ] **5.4 Create provider factory**
  ```ts
  function createAIProvider(config?: { type: "mock" | "vercel"; apiKey?: string }): AIProvider
  ```
  - Defaults to `MockAIProvider` when no API key is provided
  - Easy switch for development vs production

---

## Step 6: Demo/Fallback Course Data

**File:** `src/agents/data/demoCourses.ts`

- [ ] **6.1 Create one complete demo course: "Intro to TypeScript"**
  - 6 fully authored lessons with real markdown content
  - Each lesson has 2-3 `DynamicFormSchema` interactive elements
  - 4 quizzes (one every 1-2 lessons)
  - Covers: types, interfaces, generics, type narrowing, utility types, project setup
  - Serves as both the offline fallback and a test fixture

- [ ] **6.2 Create outline-only templates for 3 additional topics**
  - "Python for Data Science" — outlines + first lesson only
  - "React Fundamentals" — outlines + first lesson only
  - "Machine Learning Basics" — outlines + first lesson only
  - Used by `MockAIProvider` when user picks a matching topic

- [ ] **6.3 Create a generic topic template**
  - Template with placeholder slots: `{{TOPIC}}`, `{{LEVEL}}`
  - `MockAIProvider` fills these in for any topic not in the pre-authored set
  - Produces a reasonable-looking course structure even without AI

---

## Step 7: Hook Into the DynamicUI Input Form

**File:** `src/pages/HomePage.tsx` (from Phase 1 of main TODO)

- [ ] **7.1 Build the topic selection schema**
  ```ts
  const topicSelectionSchema: DynamicFormSchema = {
    title: "Create Your Course",
    description: "Tell us what you want to learn",
    fields: [
      { id: "topic", type: "text", label: "Course Topic", required: true,
        placeholder: "e.g., Rust programming, Machine Learning, CSS Grid..." },
      { id: "level", type: "single-choice", label: "Experience Level", required: true,
        options: [
          { value: "beginner", label: "Beginner", description: "No prior knowledge" },
          { value: "intermediate", label: "Intermediate", description: "Some familiarity" },
          { value: "advanced", label: "Advanced", description: "Looking to go deeper" },
        ]},
      { id: "courseLength", type: "single-choice", label: "Course Length", required: true,
        options: [
          { value: "quick", label: "Quick (3 lessons)" },
          { value: "standard", label: "Standard (6 lessons)" },
          { value: "deep-dive", label: "Deep Dive (10 lessons)" },
        ]},
      { id: "learningStyle", type: "single-choice", label: "Learning Style",
        options: [
          { value: "conceptual", label: "Conceptual", description: "Theory and principles" },
          { value: "hands-on", label: "Hands-on", description: "Code and exercises" },
          { value: "mixed", label: "Mixed", description: "Balance of both" },
        ],
        defaultValue: "mixed" },
    ],
  };
  ```

- [ ] **7.2 Wire `onSubmit` to the agent**
  - Convert `FormValues` → `CoursePreferences`
  - Call `generateCourse(prefs, onStep)`
  - Pass `onStep` to the generating view for live progress

---

## Step 8: Course Generation Progress UI

**File:** `src/components/course/CourseGeneratingView.tsx`

- [ ] **8.1 Build the progress component**
  - Listens to `AgentStep` emissions from the orchestrator
  - Displays:
    - "Planning your course..." with spinner (during `planning`)
    - Lesson titles appearing one by one (during `outline-ready`)
    - "Generating Lesson 1: [Title]..." (during `generating-lesson`)
    - Checkmarks next to completed items
  - Animated transitions between steps (Tailwind `animate` utilities)

- [ ] **8.2 Add error recovery UI**
  - If `AgentStep.type === "error"`:
    - Show error message
    - "Retry" button → re-invokes `generateCourse()`
    - "Use Demo Course" button → loads fallback from `demoCourses.ts`

- [ ] **8.3 Completion transition**
  - On `AgentStep.type === "complete"`:
    - Store `Course` in Zustand
    - Brief success animation
    - Auto-navigate to `/course/:id/lesson/0`

---

## File Summary

```
src/
├── types/
│   └── course.ts                          # Step 1 — all course types
├── agents/
│   ├── courseGeneratorAgent.ts             # Step 3 — orchestrator + functions
│   ├── prompts/
│   │   └── coursePrompts.ts               # Step 2 — prompt templates
│   ├── validation/
│   │   └── courseSchemas.ts               # Step 4 — Zod schemas
│   ├── providers/
│   │   └── aiProvider.ts                  # Step 5 — AI provider abstraction
│   └── data/
│       └── demoCourses.ts                 # Step 6 — fallback content
├── pages/
│   └── HomePage.tsx                       # Step 7 — topic form + agent wiring
└── components/
    └── course/
        └── CourseGeneratingView.tsx        # Step 8 — progress UI
```

## Implementation Order

1. **Types first** (Step 1) — everything depends on these
2. **Prompts** (Step 2) — define what the agent will say
3. **Validation** (Step 4) — needed before agent core
4. **AI Provider** (Step 5) — mock first, then real
5. **Demo data** (Step 6) — needed for mock provider and testing
6. **Agent core** (Step 3) — the orchestrator wiring it all together
7. **Home page form** (Step 7) — user-facing input
8. **Progress UI** (Step 8) — visual feedback during generation
