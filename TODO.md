# DUX — Agentic Interactive Course Platform

## Vision

A full-stack platform where users pick any topic and an AI-powered agentic backend
dynamically generates a personalized course — lessons, quizzes, exercises, and
adaptive tutoring. The **backend** is Python-powered with LangGraph state machines,
LangChain tool-calling agents, MCP servers for resource access, and the ReAct
reasoning framework. The **frontend** is a React app that consumes the backend API,
with DynamicUI as one component among a broader course platform UI.

---

## Project Structure

```
DUX/
├── frontend/                        # React + Vite + TypeScript
│   ├── src/
│   │   ├── api/                     # API client, SSE stream helpers
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn primitives (existing)
│   │   │   ├── fields/             # DynamicUI field components (existing)
│   │   │   ├── DynamicUI.tsx       # Schema-driven forms (existing)
│   │   │   ├── layout/            # AppShell, Sidebar, TopBar
│   │   │   └── course/            # CourseCard, LessonView, QuizView, etc.
│   │   ├── pages/                  # Route-level pages
│   │   ├── store/                  # Zustand state management
│   │   ├── types/                  # Shared TS types
│   │   ├── hooks/                  # Custom React hooks
│   │   └── lib/                    # Utilities
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                         # Python — FastAPI + LangGraph + LangChain
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── api/
│   │   │   └── routes/             # REST + SSE endpoints
│   │   ├── agents/
│   │   │   ├── graphs/             # LangGraph state machines
│   │   │   ├── nodes/              # Individual graph nodes (ReAct steps)
│   │   │   ├── tools/              # LangChain tools for agents
│   │   │   └── prompts/            # Prompt templates
│   │   ├── mcp/
│   │   │   ├── servers/            # MCP server implementations
│   │   │   └── client.py           # MCP client wrapper
│   │   ├── models/                 # Pydantic schemas
│   │   ├── services/               # Business logic layer
│   │   ├── eval/                   # Agent evaluation framework
│   │   └── config.py               # Settings & env management
│   ├── tests/
│   │   ├── unit/                   # Unit tests
│   │   ├── integration/            # Integration tests
│   │   ├── eval/                   # Evaluation test suites
│   │   └── conftest.py             # Shared fixtures
│   ├── pyproject.toml
│   └── Makefile
│
└── docker-compose.yml               # Full stack orchestration
```

---

## Phase 1: Repository Restructure

- [ ] **1.1 Create `frontend/` directory**
  - Move all existing files (src/, public/, package.json, vite.config.ts,
    tsconfig.*, tailwind.config.js, postcss.config.js, components.json,
    index.html, eslint.config.js) into `frontend/`
  - Update vite.config.ts paths if needed
  - Verify `npm run dev` still works from `frontend/`

- [ ] **1.2 Create `backend/` directory scaffold**
  - `pyproject.toml` with dependencies:
    - `fastapi`, `uvicorn[standard]`
    - `langchain`, `langchain-core`, `langchain-openai`, `langchain-anthropic`
    - `langgraph`
    - `mcp` (Model Context Protocol SDK)
    - `pydantic` v2
    - `python-dotenv`
    - `sse-starlette` (Server-Sent Events)
    - `httpx`
    - Dev: `pytest`, `pytest-asyncio`, `pytest-cov`, `langsmith`, `respx`
  - `backend/app/__init__.py` + `backend/app/main.py` (FastAPI skeleton)
  - `backend/tests/conftest.py`
  - `backend/Makefile` (dev, test, lint, format targets)
  - `backend/.env.example` (API key placeholders)

- [ ] **1.3 Root-level orchestration**
  - `docker-compose.yml` — frontend (node) + backend (python) services
  - Root `Makefile` or scripts for `make dev`, `make test`, `make build`
  - Update root `.gitignore` for Python artifacts (`__pycache__/`, `.venv/`,
    `*.pyc`, `.pytest_cache/`, `.mypy_cache/`)

---

## Phase 2: Backend — Pydantic Models & API Skeleton

- [ ] **2.1 Define Pydantic models**
  - `backend/app/models/course.py`:
    - `CoursePreferences` — topic, level, course_length, learning_style
    - `LessonOutline` — index, title, summary, key_topics, has_quiz
    - `Lesson` — extends outline with content (markdown), interactive_elements,
      is_completed, is_unlocked
    - `QuizQuestion` — id, question, question_type, options, correct_answer,
      explanation
    - `Quiz` — lesson_index, questions list
    - `Course` — id, title, description, lessons, quizzes, created_at
  - `backend/app/models/agent.py`:
    - `AgentStep` — discriminated union for streaming progress events
    - `AgentState` — LangGraph state schema (messages, course_data,
      current_step, user_context)
  - `backend/app/models/api.py`:
    - Request/response schemas for all endpoints

- [ ] **2.2 Create FastAPI routes**
  - `POST /api/courses` — create a new course (kicks off agent pipeline)
  - `GET  /api/courses/{id}/stream` — SSE endpoint for generation progress
  - `GET  /api/courses/{id}` — get course with current state
  - `POST /api/courses/{id}/lessons/{idx}/generate` — on-demand lesson generation
  - `POST /api/courses/{id}/quizzes/{idx}/generate` — on-demand quiz generation
  - `POST /api/courses/{id}/quizzes/{idx}/grade` — submit quiz answers for grading
  - `POST /api/courses/{id}/feedback` — submit user interaction data to tutor agent
  - `GET  /api/health` — health check

- [ ] **2.3 Create config management**
  - `backend/app/config.py` — Pydantic Settings class
  - Load from `.env`: LLM provider, API keys, model names, temperature defaults
  - Support multiple LLM backends (OpenAI, Anthropic, local)

---

## Phase 3: Backend — LangGraph Agent Graphs

- [ ] **3.1 Course Planner Graph** (`backend/app/agents/graphs/course_planner.py`)
  - LangGraph `StateGraph` with nodes:
    1. `analyze_topic` — ReAct reasoning to research the topic and user level
    2. `generate_outline` — Produce structured lesson outlines
    3. `validate_outline` — Self-check: are lessons progressive? complete? right level?
    4. `refine_outline` — If validation fails, loop back with corrections (max 2 retries)
    5. `finalize` — Emit completed course skeleton
  - Conditional edges: validate → refine (if issues) | validate → finalize (if clean)
  - State: `AgentState` with messages, course_preferences, outline_draft, validation_result

- [ ] **3.2 Lesson Writer Graph** (`backend/app/agents/graphs/lesson_writer.py`)
  - LangGraph `StateGraph` with nodes:
    1. `research` — ReAct agent uses tools to gather relevant information
    2. `draft_content` — Write full markdown lesson
    3. `generate_interactive` — Create DynamicUI schema elements for knowledge checks
    4. `review` — Self-review for accuracy, level appropriateness, completeness
    5. `revise` — Fix issues if review found problems (conditional loop)
    6. `finalize` — Emit completed lesson
  - Tools available to the research node (via LangChain tool-calling):
    - `web_search` — search for current information on the topic
    - `fetch_reference` — retrieve content from URLs
    - `get_prerequisites` — look up what prior lessons covered

- [ ] **3.3 Quiz Generator Graph** (`backend/app/agents/graphs/quiz_generator.py`)
  - LangGraph `StateGraph` with nodes:
    1. `analyze_lesson` — Extract key concepts and learning objectives
    2. `generate_questions` — Create diverse question set (MC, T/F, short answer)
    3. `validate_answers` — ReAct: verify each correct_answer is actually correct
    4. `calibrate_difficulty` — Adjust based on user level
    5. `finalize` — Emit validated quiz
  - Loops back from validate → generate if answers are wrong

- [ ] **3.4 Tutor Agent Graph** (`backend/app/agents/graphs/tutor.py`)
  - LangGraph `StateGraph` with nodes:
    1. `assess_performance` — Analyze quiz scores, time spent, interaction patterns
    2. `decide_action` — ReAct reasoning: what does the student need?
    3. `generate_feedback` — Produce personalized feedback message
    4. `adapt_next_lesson` — Modify next lesson parameters (depth, pace, examples)
  - Reads from shared state: all quiz scores, lesson completions, user interactions
  - Outputs: feedback text, next lesson adjustments, optional supplementary content

- [ ] **3.5 Orchestrator Graph** (`backend/app/agents/graphs/orchestrator.py`)
  - Top-level `StateGraph` that composes the sub-graphs:
    1. `plan_course` → invokes Course Planner Graph
    2. `generate_lesson` → invokes Lesson Writer Graph (per lesson)
    3. `generate_quiz` → invokes Quiz Generator Graph (per quiz)
    4. `tutor_check` → invokes Tutor Agent Graph (between lessons)
  - Manages overall course state and progression
  - Handles streaming of `AgentStep` events to the API layer

---

## Phase 4: Backend — LangChain Tools & ReAct Agents

- [ ] **4.1 Define LangChain tools** (`backend/app/agents/tools/`)
  - `curriculum_tools.py`:
    - `search_topic_info` — Web search for topic context
    - `get_learning_objectives` — Generate Bloom's taxonomy-aligned objectives
    - `check_prerequisite_coverage` — Verify prior lessons cover needed prereqs
  - `content_tools.py`:
    - `generate_code_example` — Create runnable code snippets for the topic
    - `generate_diagram_description` — Produce text descriptions of diagrams
    - `validate_technical_accuracy` — Cross-check facts against known sources
  - `assessment_tools.py`:
    - `generate_distractor_options` — Create plausible wrong answers for MC
    - `evaluate_answer` — Grade a short-answer response
    - `calculate_difficulty_score` — Rate question difficulty (1-5)

- [ ] **4.2 Implement ReAct agent pattern**
  - Use `create_react_agent()` from LangGraph for tool-calling nodes
  - System prompts enforce structured reasoning:
    - Thought → Action → Observation → ... → Final Answer
  - Bind tools to specific graph nodes (not all tools everywhere)
  - Configure tool-calling with structured output where possible

- [ ] **4.3 LLM provider abstraction**
  - `backend/app/agents/llm.py`
  - Factory function returning `ChatOpenAI`, `ChatAnthropic`, or custom
  - Configurable per-agent (e.g., fast model for quiz validation, capable
    model for lesson writing)
  - Support for fallback chains: primary model → fallback model

---

## Phase 5: Backend — MCP Integration

- [ ] **5.1 MCP Curriculum Resource Server** (`backend/app/mcp/servers/curriculum.py`)
  - Exposes curriculum data as MCP resources:
    - `curriculum://courses/{id}` — full course data
    - `curriculum://courses/{id}/lessons/{idx}` — single lesson
    - `curriculum://courses/{id}/progress` — user progress state
  - MCP tools:
    - `update_lesson_status` — mark lesson complete
    - `record_quiz_score` — store quiz results
    - `get_student_profile` — retrieve aggregated learner data
  - Registered as a local MCP server the agents can call

- [ ] **5.2 MCP Content Research Server** (`backend/app/mcp/servers/research.py`)
  - Resources:
    - `research://topics/{topic}` — cached topic research results
    - `research://references` — curated reference materials
  - Tools:
    - `search_web` — web search with caching
    - `fetch_documentation` — pull docs from known sources
    - `summarize_source` — compress long references for context windows
  - Allows agents to access research data through a standardized protocol

- [ ] **5.3 MCP client integration** (`backend/app/mcp/client.py`)
  - Wrapper that connects LangChain agents to MCP servers
  - Converts MCP tools ↔ LangChain tools bidirectionally
  - Handles MCP resource reads within agent tool calls
  - Session management for MCP connections

---

## Phase 6: Frontend — Platform UI

- [ ] **6.1 Install additional frontend dependencies**
  - `react-router-dom` — routing
  - `zustand` — state management
  - `react-markdown` + `remark-gfm` — markdown rendering
  - `lucide-react` — icons
  - `react-syntax-highlighter` — code blocks in lessons

- [ ] **6.2 Set up routing and layout**
  - Routes:
    - `/` — Landing / course creation
    - `/courses/:id` — Course overview with lesson list
    - `/courses/:id/lessons/:idx` — Lesson view
    - `/courses/:id/quizzes/:idx` — Quiz view
    - `/courses/:id/progress` — Progress dashboard
  - Layout components:
    - `AppShell` — sidebar + main content
    - `Sidebar` — course outline navigation with progress indicators
    - `TopBar` — breadcrumbs, dark mode toggle

- [ ] **6.3 Build API client** (`frontend/src/api/`)
  - `client.ts` — base HTTP client (fetch wrapper) pointing at backend
  - `courses.ts` — course CRUD endpoints
  - `stream.ts` — SSE event stream consumer for agent progress
  - Type-safe request/response using shared types

- [ ] **6.4 Build course creation page**
  - Hero section with app description
  - DynamicUI form for topic selection (topic, level, length, learning style)
  - On submit → POST to backend → show generation progress view
  - `CourseGeneratingView` — streams `AgentStep` events via SSE,
    displays live progress (planning → outline → lesson generation)

- [ ] **6.5 Build lesson page**
  - Markdown renderer for lesson content
  - Inline DynamicUI elements for knowledge checks
  - Lesson navigation (prev/next) with sidebar position indicator
  - "Mark Complete" button → POST to backend

- [ ] **6.6 Build quiz page**
  - DynamicUI-driven quiz form (single-choice, text, boolean questions)
  - Submit → POST to grading endpoint
  - Results view: score, per-question breakdown with explanations
  - Retry or continue navigation

- [ ] **6.7 Build progress dashboard**
  - Overall completion bar
  - Per-lesson status (locked / active / completed)
  - Quiz score history
  - Tutor feedback messages
  - Zustand store with `localStorage` persistence

- [ ] **6.8 Tutor feedback component**
  - Appears between lessons as AI "tutor" message card
  - Streamed from backend tutor agent
  - Optional interactive follow-up via DynamicUI (confidence rating, review request)

---

## Phase 7: Backend — Testing

- [ ] **7.1 Unit tests** (`backend/tests/unit/`)
  - `test_models.py` — Pydantic model validation (valid + invalid inputs)
  - `test_tools.py` — each LangChain tool in isolation (mock LLM responses)
  - `test_prompts.py` — prompt template rendering with various inputs
  - `test_config.py` — settings loading, env var handling

- [ ] **7.2 Integration tests** (`backend/tests/integration/`)
  - `test_course_planner_graph.py` — full graph execution with mock LLM
  - `test_lesson_writer_graph.py` — end-to-end lesson generation
  - `test_quiz_generator_graph.py` — quiz generation + validation loop
  - `test_tutor_graph.py` — adaptive feedback with simulated student data
  - `test_orchestrator.py` — full pipeline: preferences → course
  - `test_api_routes.py` — FastAPI TestClient endpoint tests
  - `test_mcp_servers.py` — MCP resource reads and tool calls

- [ ] **7.3 Test fixtures & mocking**
  - `conftest.py` — shared fixtures:
    - Mock LLM that returns deterministic responses
    - Sample `CoursePreferences`, `LessonOutline`, `Course` objects
    - FastAPI TestClient fixture
  - `FakeLLM` class — records calls, returns canned responses per prompt pattern
  - `respx` mocks for any external HTTP calls

---

## Phase 8: Backend — Evaluation Framework

- [ ] **8.1 Evaluation datasets** (`backend/tests/eval/datasets/`)
  - `course_outlines.json` — 10+ (topic, expected_qualities) pairs
  - `lesson_content.json` — 10+ (outline + level, quality_criteria) pairs
  - `quiz_questions.json` — 10+ (lesson_summary, expected_question_properties) pairs
  - Each dataset entry: input parameters + human-labeled quality rubric

- [ ] **8.2 Evaluation metrics** (`backend/app/eval/metrics.py`)
  - `outline_quality_score` — evaluates: topic coverage, progressive difficulty,
    appropriate lesson count, no redundancy (0-1 score)
  - `lesson_quality_score` — evaluates: accuracy, level-appropriateness,
    completeness, engagement, working code examples (0-1 score)
  - `quiz_validity_score` — evaluates: correct answers are correct, distractors
    are plausible, difficulty matches level, explanations are helpful (0-1 score)
  - `tutor_adaptation_score` — evaluates: feedback relevance, adaptation
    accuracy, encouragement quality (0-1 score)

- [ ] **8.3 Eval runner** (`backend/app/eval/runner.py`)
  - `run_eval(agent, dataset, metric)` — runs agent on dataset, applies metric
  - LLM-as-judge for subjective quality (with rubric in system prompt)
  - Deterministic checks for structural validity (JSON schema, field presence)
  - Outputs: per-example scores, aggregate stats, failure cases
  - Integrates with LangSmith for tracing (optional, if API key set)

- [ ] **8.4 Eval test commands**
  - `make eval` — run full eval suite
  - `make eval-quick` — run structural-only evals (no LLM judge, fast)
  - `pytest tests/eval/ -v` — run as part of test suite
  - CI-friendly: exits non-zero if aggregate score below threshold

---

## Phase 9: Frontend — Testing

- [ ] **9.1 Component tests**
  - Test DynamicUI renders all field types correctly
  - Test course creation form submission
  - Test lesson page markdown rendering + interactive elements
  - Test quiz submission and results display

- [ ] **9.2 Integration tests**
  - API client tests with mocked backend responses
  - SSE stream consumer tests
  - Full user flow: create course → view lesson → take quiz → see progress

---

## Phase 10: Polish & Integration

- [ ] **10.1 Docker Compose setup**
  - Frontend service: node + vite dev server (or nginx for prod build)
  - Backend service: python + uvicorn
  - Shared network, CORS configuration
  - `.env` file for API keys

- [ ] **10.2 Frontend proxy configuration**
  - Vite dev proxy: `/api` → `http://backend:8000`
  - Production: nginx reverse proxy or same-origin deployment

- [ ] **10.3 Error handling & resilience**
  - Backend: structured error responses, agent retry with backoff
  - Frontend: error boundaries, offline state, retry UI
  - SSE reconnection on disconnect

- [ ] **10.4 Responsive design + dark mode**
  - Mobile-friendly sidebar (collapsible drawer)
  - Existing shadcn dark mode CSS variables + toggle
  - Lesson content readable on all screen sizes

---

## Key Architecture Decisions

1. **Frontend/Backend separation** — React frontend is a thin client; all AI
   logic lives in the Python backend. Frontend communicates via REST + SSE.

2. **LangGraph for orchestration** — Each agent is a stateful graph with typed
   state, conditional edges, and retry loops. Not just prompt-in/text-out.

3. **ReAct pattern** — Agents reason explicitly (Thought → Action → Observation)
   using `create_react_agent()`. This makes agent decisions interpretable and
   debuggable.

4. **MCP for resource access** — Agents access course data and research through
   Model Context Protocol servers, decoupling data access from agent logic.

5. **DynamicUI as one component** — The existing DynamicUI system handles
   interactive forms (course setup, knowledge checks, quizzes) but is part
   of a larger platform UI, not the sole focus.

6. **Evals as first-class** — Every agent has quality metrics and evaluation
   datasets. `make eval` runs the full suite. Evals gate quality, not just tests.

7. **Progressive generation** — First lesson is generated immediately; remaining
   lessons are generated on-demand, allowing the tutor agent to adapt.
