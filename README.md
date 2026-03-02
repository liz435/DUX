# DUX - AI-Powered Course Platform

An adaptive learning platform that generates personalized courses using LangGraph agents, LangChain tools, and MCP servers. Pick any topic, choose your level, and get a full course with lessons, quizzes, and interactive elements.

## Architecture

```
frontend/   React 19 + Vite + TypeScript + Zustand + Tailwind
backend/    Python 3.11 + FastAPI + LangGraph + LangChain + MCP
```

The frontend talks to the backend via REST + SSE. Vite proxies `/api` requests to the backend during development.

## Prerequisites

- **Node.js** >= 22
- **Python** >= 3.11
- **An LLM API key** — OpenAI or Anthropic

## Quick Start

### 1. Clone and install

```bash
# Install both frontend and backend dependencies
make install
```

Or manually:

```bash
cd frontend && npm install
cd ../backend && pip install -e ".[dev]"
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your API key:

```env
# Pick your provider
LLM_PROVIDER=openai          # or "anthropic"

# Set the matching key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Models (defaults work well)
LLM_MODEL_CAPABLE=gpt-4o
LLM_MODEL_FAST=gpt-4o-mini
```

### 3. Run the dev servers

Open **two terminals**:

```bash
# Terminal 1 — backend (port 8000)
make dev-backend

# Terminal 2 — frontend (port 5173)
make dev-frontend
```

Then open **http://localhost:5173** in your browser.

### Or use Docker Compose

```bash
# Make sure backend/.env exists first
docker compose up --build
```

This starts both services. Frontend at `http://localhost:5173`, backend at `http://localhost:8000`.

## Running Tests

```bash
# All backend tests (125 tests)
make test

# Or from the backend directory with more options:
cd backend
make test              # all tests with coverage
make test-unit         # unit tests only
make test-integration  # integration tests only
```

Tests run without an API key — all LangGraph agents have deterministic fallback paths.

## Running Evals

Evals assess the quality of agent outputs (outline structure, lesson content, quiz validity, tutor adaptation).

```bash
cd backend

# Structural evals (no LLM required, fast)
make eval-quick

# Full eval suite (requires LLM API key)
make eval
```

## Linting & Formatting

```bash
# Lint everything
make lint

# Backend only
cd backend
make lint       # ruff + mypy
make format     # auto-fix
```

## Project Structure

```
backend/
  app/
    agents/
      graphs/          LangGraph StateGraph agents
        course_planner.py   Plans course outline
        lesson_writer.py    Writes lesson content
        quiz_generator.py   Generates quizzes
        tutor.py            Adaptive tutoring feedback
        orchestrator.py     Composes sub-graphs
      prompts/         System prompts + output schemas
      tools/           LangChain tools (curriculum, content, assessment)
      llm.py           LLM provider factory
    mcp/
      servers/         MCP servers (curriculum, research)
      client.py        MCP-to-LangChain bridge
    models/            Pydantic models (course, agent state, API schemas)
    api/routes/        FastAPI route handlers
    services/          Business logic + graph invocation
    eval/              Eval metrics + runner
    config.py          Settings from .env
    main.py            FastAPI app entrypoint
  tests/
    unit/              Model, tool, prompt tests
    integration/       Graph, API, MCP tests
    eval/              Eval suite + datasets

frontend/
  src/
    api/client.ts      API client + SSE streaming
    store/             Zustand state management
    components/
      layout/          AppShell, Sidebar, TopBar
      course/          CourseGeneratingView, QuizResults
      DynamicUI.tsx    Schema-driven form component
    pages/             HomePage, LessonPage, QuizPage, ProgressPage
    types/             TypeScript type definitions
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/courses` | Create a course (starts generation) |
| `GET` | `/api/courses/{id}/stream` | SSE stream of generation progress |
| `GET` | `/api/courses/{id}` | Get full course data |
| `POST` | `/api/courses/{id}/lessons/{idx}/generate` | Generate a single lesson |
| `POST` | `/api/courses/{id}/quizzes/{idx}/generate` | Generate a quiz |
| `POST` | `/api/courses/{id}/quizzes/{idx}/grade` | Grade quiz answers |
| `POST` | `/api/courses/{id}/feedback` | Submit tutor feedback |
| `GET` | `/api/health` | Health check |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openai` | `openai` or `anthropic` |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `LLM_MODEL_CAPABLE` | `gpt-4o` | Model for complex tasks (planning, writing) |
| `LLM_MODEL_FAST` | `gpt-4o-mini` | Model for simpler tasks (validation, tools) |
| `LLM_TEMPERATURE` | `0.7` | Generation temperature |
| `LANGSMITH_API_KEY` | — | Optional LangSmith tracing key |
| `LANGSMITH_PROJECT` | `dux-course-platform` | LangSmith project name |
| `HOST` | `0.0.0.0` | Backend host |
| `PORT` | `8000` | Backend port |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
