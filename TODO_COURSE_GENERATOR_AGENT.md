# Course Generator Agent — LangGraph + LangChain Implementation

## Overview

The Course Generator Agent is a LangGraph state machine orchestrating multiple
ReAct-powered sub-agents via LangChain. It takes user preferences from the
frontend, runs a multi-step reasoning pipeline — planning, writing, quizzing,
and tutoring — and streams structured progress events back via SSE. Agents access
data through MCP servers and use LangChain tools for research and validation.

---

## Step 1: Pydantic Models & State Schema

**File:** `backend/app/models/course.py`

- [ ] **1.1 `CoursePreferences`** — Input from frontend
  ```python
  class CoursePreferences(BaseModel):
      topic: str
      level: Literal["beginner", "intermediate", "advanced"]
      course_length: Literal["quick", "standard", "deep-dive"]  # 3 / 6 / 10
      learning_style: Literal["conceptual", "hands-on", "mixed"]
  ```

- [ ] **1.2 `LessonOutline`** — Lightweight, produced by planner
  ```python
  class LessonOutline(BaseModel):
      index: int
      title: str
      summary: str
      key_topics: list[str] = Field(min_length=3, max_length=5)
      has_quiz: bool
      estimated_minutes: int
  ```

- [ ] **1.3 `Lesson`** — Full content, produced by lesson writer
  ```python
  class Lesson(LessonOutline):
      content: str                          # Markdown body
      interactive_elements: list[dict]      # DynamicUI schemas
      is_completed: bool = False
      is_unlocked: bool = False
  ```

- [ ] **1.4 `QuizQuestion` + `Quiz`**
  ```python
  class QuizQuestion(BaseModel):
      id: str
      question: str
      question_type: Literal["multiple-choice", "true-false", "short-answer"]
      options: list[dict] | None = None     # {value, label}
      correct_answer: str
      explanation: str

  class Quiz(BaseModel):
      lesson_index: int
      questions: list[QuizQuestion]
  ```

- [ ] **1.5 `Course`** — Top-level aggregate
  ```python
  class Course(BaseModel):
      id: str
      title: str
      description: str
      topic: str
      level: str
      lessons: list[Lesson]
      quizzes: list[Quiz]
      created_at: datetime
  ```

**File:** `backend/app/models/agent.py`

- [ ] **1.6 `AgentState`** — LangGraph TypedDict state schema
  ```python
  class AgentState(TypedDict):
      messages: Annotated[list[BaseMessage], add_messages]
      course_preferences: CoursePreferences
      outline: list[LessonOutline]
      lessons: list[Lesson]
      quizzes: list[Quiz]
      current_step: str
      validation_result: dict | None
      retry_count: int
      student_profile: dict          # Aggregated performance data
  ```

- [ ] **1.7 `AgentStep`** — Streaming progress events to frontend
  ```python
  class AgentStep(BaseModel):
      type: Literal[
          "planning", "outline_ready", "generating_lesson",
          "lesson_ready", "generating_quiz", "quiz_ready",
          "tutor_feedback", "complete", "error"
      ]
      message: str
      data: dict | None = None       # Lesson index, title, course object, etc.
  ```

---

## Step 2: LangChain Tools

**Directory:** `backend/app/agents/tools/`

- [ ] **2.1 Curriculum tools** (`curriculum_tools.py`)
  ```python
  @tool
  def search_topic_info(query: str) -> str:
      """Search the web for information about a course topic."""

  @tool
  def get_learning_objectives(topic: str, level: str) -> list[str]:
      """Generate Bloom's taxonomy-aligned learning objectives."""

  @tool
  def check_prerequisite_coverage(
      current_outline: list[dict], lesson_index: int
  ) -> dict:
      """Verify that prior lessons cover prerequisites for the given lesson."""
  ```
  - `search_topic_info` wraps an HTTP search API (e.g., Tavily, SerpAPI)
  - `get_learning_objectives` uses LLM with structured output
  - `check_prerequisite_coverage` analyzes the outline graph for dependencies

- [ ] **2.2 Content tools** (`content_tools.py`)
  ```python
  @tool
  def generate_code_example(topic: str, language: str, concept: str) -> str:
      """Generate a runnable code example demonstrating a concept."""

  @tool
  def validate_technical_accuracy(claim: str, topic: str) -> dict:
      """Cross-check a technical claim for accuracy. Returns {valid, correction}."""

  @tool
  def generate_interactive_schema(
      context: str, check_type: str
  ) -> dict:
      """Generate a DynamicUI form schema for an inline knowledge check."""
  ```
  - `generate_code_example` calls LLM with code-focused prompt, validates syntax
  - `validate_technical_accuracy` uses a search tool + LLM judge
  - `generate_interactive_schema` produces JSON matching DynamicUI `DynamicFormSchema`

- [ ] **2.3 Assessment tools** (`assessment_tools.py`)
  ```python
  @tool
  def generate_distractor_options(
      question: str, correct_answer: str, count: int = 3
  ) -> list[str]:
      """Create plausible wrong answers for a multiple-choice question."""

  @tool
  def evaluate_short_answer(
      question: str, expected: str, student_answer: str
  ) -> dict:
      """Grade a short-answer response. Returns {score, feedback}."""

  @tool
  def calculate_difficulty(question: str, options: list[str]) -> int:
      """Rate question difficulty on a 1-5 scale."""
  ```

- [ ] **2.4 Tool registration & binding**
  - Create `get_curriculum_tools()`, `get_content_tools()`, `get_assessment_tools()`
    factory functions
  - Each returns a `list[BaseTool]` for binding to specific graph nodes
  - Tools are scoped: planner gets curriculum tools, writer gets content tools, etc.

---

## Step 3: Prompt Templates

**Directory:** `backend/app/agents/prompts/`

- [ ] **3.1 System prompts** (`system_prompts.py`)
  - `COURSE_PLANNER_SYSTEM` — "You are an expert curriculum designer..."
    - Enforces structured JSON output for outlines
    - Includes Bloom's taxonomy reference
    - Level-adaptive vocabulary instructions
  - `LESSON_WRITER_SYSTEM` — "You are an expert educator and technical writer..."
    - Markdown formatting rules
    - Interactive element placement markers: `{{CHECK:id}}`
    - Level-aware depth and analogy usage
  - `QUIZ_GENERATOR_SYSTEM` — "You are an assessment specialist..."
    - Question type distribution rules
    - Answer validation requirements
    - Difficulty calibration per level
  - `TUTOR_SYSTEM` — "You are a supportive, adaptive tutor..."
    - Performance analysis framework
    - Feedback tone guidelines
    - Adaptation strategies per score range

- [ ] **3.2 ReAct reasoning prompts** (`react_prompts.py`)
  - `REACT_RESEARCH_PROMPT` — guides the research step:
    ```
    Think step by step about what information you need:
    Thought: What do I need to know about {topic} for a {level} audience?
    Action: Use tools to gather information
    Observation: [tool result]
    ... repeat ...
    Final Answer: Structured information for content generation
    ```
  - `REACT_VALIDATION_PROMPT` — guides self-check steps:
    ```
    Review the generated content critically:
    Thought: Is this accurate? Is it at the right level? Is anything missing?
    Action: Use validation tools to verify claims
    Observation: [validation result]
    Final Answer: {valid: true/false, issues: [...], suggestions: [...]}
    ```

- [ ] **3.3 Structured output schemas** (`output_schemas.py`)
  - Define Pydantic models used as `with_structured_output()` targets:
    - `OutlineOutput` — list of `LessonOutline`
    - `LessonOutput` — content + interactive markers
    - `QuizOutput` — list of `QuizQuestion`
    - `ValidationOutput` — valid flag + issues list
    - `TutorOutput` — feedback text + adaptation params
  - These enforce reliable JSON from the LLM, no regex parsing needed

---

## Step 4: LangGraph — Course Planner Graph

**File:** `backend/app/agents/graphs/course_planner.py`

- [ ] **4.1 Define the state graph**
  ```python
  planner_graph = StateGraph(AgentState)

  planner_graph.add_node("analyze_topic", analyze_topic_node)
  planner_graph.add_node("generate_outline", generate_outline_node)
  planner_graph.add_node("validate_outline", validate_outline_node)
  planner_graph.add_node("refine_outline", refine_outline_node)
  planner_graph.add_node("finalize", finalize_node)

  planner_graph.add_edge(START, "analyze_topic")
  planner_graph.add_edge("analyze_topic", "generate_outline")
  planner_graph.add_edge("generate_outline", "validate_outline")
  planner_graph.add_conditional_edges("validate_outline", should_refine,
      {"refine": "refine_outline", "accept": "finalize"})
  planner_graph.add_edge("refine_outline", "validate_outline")  # loop
  planner_graph.add_edge("finalize", END)
  ```

- [ ] **4.2 Implement `analyze_topic_node`**
  - ReAct agent with `search_topic_info` + `get_learning_objectives` tools
  - Researches the topic to build context
  - Determines appropriate scope based on level + course_length
  - Outputs: enriched topic context added to state messages

- [ ] **4.3 Implement `generate_outline_node`**
  - Uses `COURSE_PLANNER_SYSTEM` prompt + topic context from prior step
  - Calls LLM with `with_structured_output(OutlineOutput)`
  - Maps `course_length` → exact lesson count (quick=3, standard=6, deep-dive=10)
  - Writes `outline` to state

- [ ] **4.4 Implement `validate_outline_node`**
  - ReAct agent with `check_prerequisite_coverage` tool
  - Checks: progressive difficulty, no gaps, no redundancy, correct count
  - Uses `REACT_VALIDATION_PROMPT`
  - Writes `validation_result` to state

- [ ] **4.5 Implement `should_refine` conditional edge**
  ```python
  def should_refine(state: AgentState) -> str:
      if state["validation_result"]["valid"] or state["retry_count"] >= 2:
          return "accept"
      return "refine"
  ```

- [ ] **4.6 Implement `refine_outline_node`**
  - Takes validation issues, generates corrected outline
  - Increments `retry_count`
  - Writes updated `outline` to state

- [ ] **4.7 Implement `finalize_node`**
  - Constructs `Course` object shell with outlines (no full content yet)
  - First lesson marked `is_unlocked = True`
  - Emits `AgentStep(type="outline_ready")`

---

## Step 5: LangGraph — Lesson Writer Graph

**File:** `backend/app/agents/graphs/lesson_writer.py`

- [ ] **5.1 Define the state graph**
  ```python
  writer_graph = StateGraph(LessonWriterState)

  writer_graph.add_node("research", research_node)
  writer_graph.add_node("draft", draft_content_node)
  writer_graph.add_node("add_interactive", add_interactive_node)
  writer_graph.add_node("review", review_node)
  writer_graph.add_node("revise", revise_node)
  writer_graph.add_node("finalize", finalize_node)

  writer_graph.add_edge(START, "research")
  writer_graph.add_edge("research", "draft")
  writer_graph.add_edge("draft", "add_interactive")
  writer_graph.add_edge("add_interactive", "review")
  writer_graph.add_conditional_edges("review", should_revise,
      {"revise": "revise", "accept": "finalize"})
  writer_graph.add_edge("revise", "review")  # loop
  writer_graph.add_edge("finalize", END)
  ```

- [ ] **5.2 Implement `research_node`**
  - ReAct agent bound to `search_topic_info`, `generate_code_example`
  - Gathers material specific to this lesson's `key_topics`
  - Considers what prior lessons covered (from state) for continuity
  - Outputs research context into state messages

- [ ] **5.3 Implement `draft_content_node`**
  - Uses `LESSON_WRITER_SYSTEM` + research context
  - Generates full markdown with `{{CHECK:id}}` markers for interactive elements
  - Adapts tone: beginner → analogies + slow pace; advanced → concise + deep
  - Structured output: `LessonOutput` (content + marker locations)

- [ ] **5.4 Implement `add_interactive_node`**
  - For each `{{CHECK:id}}` marker in the draft:
    - Calls `generate_interactive_schema` tool with surrounding context
    - Produces a `DynamicFormSchema`-compatible JSON object
  - Replaces markers with indexed references
  - Adds `interactive_elements` list to state

- [ ] **5.5 Implement `review_node`**
  - ReAct agent with `validate_technical_accuracy` tool
  - Self-review prompt: accuracy, completeness, level match, code correctness
  - Outputs: `ValidationOutput` with issues list

- [ ] **5.6 Implement `revise_node`**
  - Takes review issues, rewrites problematic sections
  - Max 1 revision loop (total 2 passes)

- [ ] **5.7 Implement `finalize_node`**
  - Assembles `Lesson` Pydantic model from state
  - Emits `AgentStep(type="lesson_ready")`

---

## Step 6: LangGraph — Quiz Generator Graph

**File:** `backend/app/agents/graphs/quiz_generator.py`

- [ ] **6.1 Define the state graph**
  ```python
  quiz_graph = StateGraph(QuizGeneratorState)

  quiz_graph.add_node("analyze_lesson", analyze_lesson_node)
  quiz_graph.add_node("generate_questions", generate_questions_node)
  quiz_graph.add_node("validate_answers", validate_answers_node)
  quiz_graph.add_node("calibrate", calibrate_difficulty_node)
  quiz_graph.add_node("finalize", finalize_node)

  quiz_graph.add_edge(START, "analyze_lesson")
  quiz_graph.add_edge("analyze_lesson", "generate_questions")
  quiz_graph.add_edge("generate_questions", "validate_answers")
  quiz_graph.add_conditional_edges("validate_answers", answers_valid,
      {"fix": "generate_questions", "ok": "calibrate"})
  quiz_graph.add_edge("calibrate", "finalize")
  quiz_graph.add_edge("finalize", END)
  ```

- [ ] **6.2 Implement `analyze_lesson_node`**
  - Extracts key concepts, learning objectives, and facts from the lesson
  - Identifies which topics should be tested
  - Outputs concept list into state

- [ ] **6.3 Implement `generate_questions_node`**
  - ReAct agent with `generate_distractor_options`, `calculate_difficulty`
  - Generates 4-6 questions with a mix of types
  - Uses `with_structured_output(QuizOutput)` for reliable JSON
  - Ensures each key_topic has at least one question

- [ ] **6.4 Implement `validate_answers_node`**
  - For each question: verify `correct_answer` is actually correct
  - For multiple-choice: verify distractors are wrong but plausible
  - Uses `validate_technical_accuracy` tool for fact-checking
  - Outputs pass/fail per question

- [ ] **6.5 Implement `calibrate_difficulty_node`**
  - Adjusts question set based on user level:
    - Beginner → more recall, fewer analysis questions
    - Advanced → more application + synthesis questions
  - Reorders questions from easier to harder

- [ ] **6.6 Implement `finalize_node`**
  - Assembles `Quiz` Pydantic model
  - Emits `AgentStep(type="quiz_ready")`

---

## Step 7: LangGraph — Tutor Agent Graph

**File:** `backend/app/agents/graphs/tutor.py`

- [ ] **7.1 Define the state graph**
  ```python
  tutor_graph = StateGraph(TutorState)

  tutor_graph.add_node("assess", assess_performance_node)
  tutor_graph.add_node("decide", decide_action_node)
  tutor_graph.add_node("generate_feedback", generate_feedback_node)
  tutor_graph.add_node("adapt", adapt_next_lesson_node)

  tutor_graph.add_edge(START, "assess")
  tutor_graph.add_edge("assess", "decide")
  tutor_graph.add_edge("decide", "generate_feedback")
  tutor_graph.add_edge("generate_feedback", "adapt")
  tutor_graph.add_edge("adapt", END)
  ```

- [ ] **7.2 Implement `assess_performance_node`**
  - Reads `student_profile` from state: quiz scores, completion times, interactions
  - Calculates: average score, trend (improving/declining), weak topics
  - Outputs assessment summary

- [ ] **7.3 Implement `decide_action_node`**
  - ReAct reasoning about what the student needs:
    - Score < 70% → supplementary content, simpler explanations
    - Score 70-90% → continue normally, minor adjustments
    - Score > 90% → offer advanced/bonus content, faster pace
  - Outputs: action plan (supplement / continue / challenge)

- [ ] **7.4 Implement `generate_feedback_node`**
  - Produces personalized feedback message
  - Encouraging tone, specific to what went well/poorly
  - Optionally includes a DynamicUI follow-up schema:
    - "Rate your confidence" (slider)
    - "Would you like to review X?" (boolean)

- [ ] **7.5 Implement `adapt_next_lesson_node`**
  - Modifies next lesson generation parameters:
    - Add/remove topics
    - Adjust depth level
    - Add more/fewer examples
  - Writes adaptation params to state for the lesson writer to consume

---

## Step 8: MCP Server Implementations

**Directory:** `backend/app/mcp/`

- [ ] **8.1 Curriculum MCP Server** (`servers/curriculum.py`)
  ```python
  @server.resource("curriculum://courses/{course_id}")
  async def get_course(course_id: str) -> Course: ...

  @server.resource("curriculum://courses/{course_id}/progress")
  async def get_progress(course_id: str) -> dict: ...

  @server.tool("update_lesson_status")
  async def update_lesson_status(
      course_id: str, lesson_index: int, completed: bool
  ) -> dict: ...

  @server.tool("record_quiz_score")
  async def record_quiz_score(
      course_id: str, quiz_index: int, score: float, answers: dict
  ) -> dict: ...
  ```
  - In-memory store (dict) for course state during a session
  - Agents read course data via `curriculum://` resources
  - Agents write progress via MCP tools

- [ ] **8.2 Research MCP Server** (`servers/research.py`)
  ```python
  @server.resource("research://topics/{topic}")
  async def get_topic_research(topic: str) -> dict: ...

  @server.tool("search_web")
  async def search_web(query: str, max_results: int = 5) -> list[dict]: ...

  @server.tool("summarize_source")
  async def summarize_source(url: str, max_tokens: int = 500) -> str: ...
  ```
  - Caches research results to avoid redundant lookups
  - Wraps external search API (Tavily/SerpAPI)
  - Agents use this for real-time topic research

- [ ] **8.3 MCP client wrapper** (`client.py`)
  - `MCPClientManager` class:
    - Starts/stops MCP server processes
    - Converts MCP tools → LangChain `BaseTool` instances
    - Handles MCP resource reads as tool calls
    - Session lifecycle management (init, use, cleanup)
  - Used by graph nodes to access MCP resources:
    ```python
    mcp_tools = mcp_client.get_langchain_tools()
    agent = create_react_agent(llm, mcp_tools + native_tools)
    ```

---

## Step 9: Orchestrator Graph (Top-Level)

**File:** `backend/app/agents/graphs/orchestrator.py`

- [ ] **9.1 Define the orchestrator state graph**
  ```python
  orchestrator = StateGraph(AgentState)

  orchestrator.add_node("plan_course", plan_course_node)
  orchestrator.add_node("generate_first_lesson", generate_first_lesson_node)
  orchestrator.add_node("generate_first_quiz", generate_first_quiz_node)
  orchestrator.add_node("finalize", finalize_course_node)

  orchestrator.add_edge(START, "plan_course")
  orchestrator.add_edge("plan_course", "generate_first_lesson")
  orchestrator.add_conditional_edges("generate_first_lesson", first_lesson_has_quiz,
      {"yes": "generate_first_quiz", "no": "finalize"})
  orchestrator.add_edge("generate_first_quiz", "finalize")
  orchestrator.add_edge("finalize", END)
  ```

- [ ] **9.2 Sub-graph invocation nodes**
  - `plan_course_node` — invokes compiled `planner_graph`
  - `generate_first_lesson_node` — invokes compiled `writer_graph` for lesson 0
  - `generate_first_quiz_node` — invokes compiled `quiz_graph` for lesson 0
  - Each node streams `AgentStep` events via a callback

- [ ] **9.3 On-demand lesson/quiz generation service**
  - `backend/app/services/course_service.py`:
    ```python
    async def generate_lesson_on_demand(course_id: str, lesson_index: int) -> Lesson:
        # Invoke writer_graph for specific lesson, with tutor adaptations
    async def generate_quiz_on_demand(course_id: str, quiz_index: int) -> Quiz:
        # Invoke quiz_graph for specific lesson
    async def run_tutor_check(course_id: str) -> TutorFeedback:
        # Invoke tutor_graph after quiz completion
    ```
  - Called by API routes when user navigates to un-generated lessons

- [ ] **9.4 SSE streaming integration**
  - `AgentStep` callback → pushes to async queue
  - API route reads from queue → yields SSE events
  - Frontend `EventSource` consumes the stream
  - Handles backpressure and client disconnection

---

## Step 10: LLM Provider Configuration

**File:** `backend/app/agents/llm.py`

- [ ] **10.1 LLM factory function**
  ```python
  def get_llm(
      purpose: Literal["planning", "writing", "assessment", "validation"] = "writing",
      streaming: bool = False
  ) -> BaseChatModel:
  ```
  - `planning` → capable model (e.g., Claude Sonnet, GPT-4o)
  - `writing` → capable model with high token limit
  - `assessment` → capable model for accuracy
  - `validation` → fast model (e.g., Haiku, GPT-4o-mini) for quick checks
  - Reads provider/model from `config.py`

- [ ] **10.2 Fallback chain**
  ```python
  llm_with_fallback = primary_llm.with_fallbacks([fallback_llm])
  ```
  - Primary model fails → automatically try fallback
  - Configurable per agent purpose

---

## Step 11: Testing

**Directory:** `backend/tests/`

- [ ] **11.1 Unit tests**
  - `test_models.py` — Pydantic model creation and validation
    - Valid course preferences → model created
    - Invalid level → validation error
    - Quiz with wrong question_type → validation error
  - `test_tools.py` — Each tool function in isolation
    - Mock LLM responses for tool internals
    - Verify tool output schemas
  - `test_prompts.py` — Prompt template rendering
    - Verify system prompts include user level
    - Verify course_length maps to correct lesson count

- [ ] **11.2 Graph integration tests**
  - `test_course_planner_graph.py`:
    - Happy path: preferences → valid outline
    - Validation failure → triggers refine loop
    - Max retries → accepts best effort
  - `test_lesson_writer_graph.py`:
    - Outline → full lesson with interactive elements
    - Review catches bad content → triggers revision
  - `test_quiz_generator_graph.py`:
    - Lesson → quiz with valid answers
    - Invalid answer detected → regeneration loop
  - `test_tutor_graph.py`:
    - Low scores → supplementary content suggested
    - High scores → challenge content suggested
  - `test_orchestrator.py`:
    - Full pipeline: preferences → course with first lesson + quiz
  - All use `FakeLLM` with canned responses per prompt pattern

- [ ] **11.3 API route tests**
  - `test_api_routes.py` using FastAPI `TestClient`:
    - POST /api/courses → 201 + course ID
    - GET /api/courses/{id} → course JSON
    - POST /api/courses/{id}/quizzes/{idx}/grade → grading result
    - GET /api/health → 200

- [ ] **11.4 MCP server tests**
  - `test_mcp_servers.py`:
    - Resource reads return valid data
    - Tool calls update state correctly
    - Invalid resource URIs → proper error

- [ ] **11.5 Test fixtures** (`conftest.py`)
  ```python
  @pytest.fixture
  def sample_preferences() -> CoursePreferences: ...
  @pytest.fixture
  def sample_outline() -> list[LessonOutline]: ...
  @pytest.fixture
  def sample_course() -> Course: ...
  @pytest.fixture
  def fake_llm() -> FakeLLM: ...
  @pytest.fixture
  def test_client() -> TestClient: ...
  ```

---

## Step 12: Evaluation Framework

**Directory:** `backend/app/eval/` + `backend/tests/eval/`

- [ ] **12.1 Evaluation datasets** (`tests/eval/datasets/`)
  - `outline_eval.json` — 10 entries:
    ```json
    {
      "input": {"topic": "Python decorators", "level": "intermediate", ...},
      "criteria": {
        "lesson_count": 6,
        "must_cover": ["basic decorators", "parameterized", "class decorators"],
        "progressive_difficulty": true,
        "no_redundant_lessons": true
      }
    }
    ```
  - `lesson_eval.json` — 10 entries with quality rubric per lesson
  - `quiz_eval.json` — 10 entries with answer correctness + difficulty criteria
  - `tutor_eval.json` — 5 entries with student profile + expected adaptation

- [ ] **12.2 Evaluation metrics** (`app/eval/metrics.py`)
  ```python
  def outline_quality_score(outline: list[LessonOutline], criteria: dict) -> float:
      """0-1 score: correct count, topic coverage, progression, no redundancy."""

  def lesson_quality_score(lesson: Lesson, criteria: dict) -> float:
      """0-1 score: accuracy, level-match, completeness, code quality."""

  def quiz_validity_score(quiz: Quiz, criteria: dict) -> float:
      """0-1 score: answers correct, distractors plausible, difficulty calibrated."""

  def tutor_adaptation_score(feedback: dict, criteria: dict) -> float:
      """0-1 score: relevant feedback, correct adaptation direction."""
  ```
  - Structural checks (JSON shape, field counts) — deterministic, fast
  - Quality checks (accuracy, engagement) — LLM-as-judge with rubric prompt
  - Combined score: weighted average of structural + quality

- [ ] **12.3 Eval runner** (`app/eval/runner.py`)
  ```python
  async def run_eval(
      agent_graph: CompiledGraph,
      dataset: list[dict],
      metric_fn: Callable,
      llm_judge: BaseChatModel | None = None
  ) -> EvalResult:
  ```
  - Runs agent on each dataset entry
  - Applies metric function to output
  - Aggregates: mean score, min, max, failure cases
  - Optional LangSmith tracing integration (if `LANGSMITH_API_KEY` set)
  - Returns `EvalResult` with per-example breakdown

- [ ] **12.4 Eval test suites** (`tests/eval/`)
  - `test_outline_eval.py` — runs planner graph on outline dataset
  - `test_lesson_eval.py` — runs writer graph on lesson dataset
  - `test_quiz_eval.py` — runs quiz graph on quiz dataset
  - `test_tutor_eval.py` — runs tutor graph on tutor dataset
  - Each asserts aggregate score ≥ threshold (e.g., 0.7)

- [ ] **12.5 Makefile targets**
  ```makefile
  eval:            ## Run full eval suite (requires LLM API key)
      pytest tests/eval/ -v --timeout=300

  eval-quick:      ## Run structural-only evals (no LLM judge, fast)
      pytest tests/eval/ -v -k "structural" --timeout=60

  eval-report:     ## Run evals and generate HTML report
      pytest tests/eval/ -v --html=eval_report.html
  ```

---

## Step 13: FastAPI Endpoints & SSE Wiring

**File:** `backend/app/api/routes/courses.py`

- [ ] **13.1 Course creation endpoint**
  ```python
  @router.post("/courses", status_code=201)
  async def create_course(prefs: CoursePreferences) -> dict:
      course_id = str(uuid4())
      # Launch orchestrator graph in background task
      background_tasks.add_task(run_orchestrator, course_id, prefs)
      return {"course_id": course_id, "status": "generating"}
  ```

- [ ] **13.2 SSE streaming endpoint**
  ```python
  @router.get("/courses/{course_id}/stream")
  async def stream_course_generation(course_id: str):
      async def event_generator():
          async for step in get_step_stream(course_id):
              yield {"event": step.type, "data": step.model_dump_json()}
      return EventSourceResponse(event_generator())
  ```

- [ ] **13.3 On-demand generation endpoints**
  ```python
  @router.post("/courses/{id}/lessons/{idx}/generate")
  async def generate_lesson(id: str, idx: int) -> Lesson: ...

  @router.post("/courses/{id}/quizzes/{idx}/generate")
  async def generate_quiz(id: str, idx: int) -> Quiz: ...

  @router.post("/courses/{id}/quizzes/{idx}/grade")
  async def grade_quiz(id: str, idx: int, answers: dict) -> dict: ...

  @router.post("/courses/{id}/feedback")
  async def submit_feedback(id: str, feedback: dict) -> dict: ...
  ```

---

## Implementation Order

```
 1. Pydantic models + AgentState          (Step 1)  — everything depends on types
 2. Config + LLM factory                  (Step 10) — needed before any agent code
 3. Prompt templates                      (Step 3)  — define agent behavior
 4. LangChain tools                       (Step 2)  — agents need tools
 5. Course Planner Graph                  (Step 4)  — first agent to build
 6. Test fixtures + planner tests         (Step 11) — test as you go
 7. Lesson Writer Graph                   (Step 5)  — second agent
 8. Quiz Generator Graph                  (Step 6)  — third agent
 9. Tutor Agent Graph                     (Step 7)  — fourth agent
10. MCP servers + client                  (Step 8)  — wire resource access
11. Orchestrator Graph                    (Step 9)  — compose sub-graphs
12. FastAPI routes + SSE                  (Step 13) — expose to frontend
13. Integration + API tests              (Step 11) — end-to-end validation
14. Eval datasets + metrics + runner      (Step 12) — quality measurement
```

---

## File Summary

```
backend/
├── app/
│   ├── main.py
│   ├── config.py                              # Step 10
│   ├── models/
│   │   ├── course.py                          # Step 1
│   │   ├── agent.py                           # Step 1
│   │   └── api.py                             # Step 1
│   ├── agents/
│   │   ├── llm.py                             # Step 10
│   │   ├── tools/
│   │   │   ├── curriculum_tools.py            # Step 2
│   │   │   ├── content_tools.py               # Step 2
│   │   │   └── assessment_tools.py            # Step 2
│   │   ├── prompts/
│   │   │   ├── system_prompts.py              # Step 3
│   │   │   ├── react_prompts.py               # Step 3
│   │   │   └── output_schemas.py              # Step 3
│   │   └── graphs/
│   │       ├── course_planner.py              # Step 4
│   │       ├── lesson_writer.py               # Step 5
│   │       ├── quiz_generator.py              # Step 6
│   │       ├── tutor.py                       # Step 7
│   │       └── orchestrator.py                # Step 9
│   ├── mcp/
│   │   ├── servers/
│   │   │   ├── curriculum.py                  # Step 8
│   │   │   └── research.py                    # Step 8
│   │   └── client.py                          # Step 8
│   ├── services/
│   │   └── course_service.py                  # Step 9
│   ├── api/
│   │   └── routes/
│   │       └── courses.py                     # Step 13
│   └── eval/
│       ├── metrics.py                         # Step 12
│       └── runner.py                          # Step 12
├── tests/
│   ├── conftest.py                            # Step 11
│   ├── unit/
│   │   ├── test_models.py                     # Step 11
│   │   ├── test_tools.py                      # Step 11
│   │   └── test_prompts.py                    # Step 11
│   ├── integration/
│   │   ├── test_course_planner_graph.py       # Step 11
│   │   ├── test_lesson_writer_graph.py        # Step 11
│   │   ├── test_quiz_generator_graph.py       # Step 11
│   │   ├── test_tutor_graph.py                # Step 11
│   │   ├── test_orchestrator.py               # Step 11
│   │   ├── test_api_routes.py                 # Step 11
│   │   └── test_mcp_servers.py                # Step 11
│   └── eval/
│       ├── datasets/
│       │   ├── outline_eval.json              # Step 12
│       │   ├── lesson_eval.json               # Step 12
│       │   ├── quiz_eval.json                 # Step 12
│       │   └── tutor_eval.json                # Step 12
│       ├── test_outline_eval.py               # Step 12
│       ├── test_lesson_eval.py                # Step 12
│       ├── test_quiz_eval.py                  # Step 12
│       └── test_tutor_eval.py                 # Step 12
├── pyproject.toml
├── Makefile
└── .env.example
```
