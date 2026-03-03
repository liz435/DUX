from __future__ import annotations

from typing import Annotated, Any, Literal

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from app.models.course import CoursePreferences, Lesson, LessonOutline, Quiz


# ---------------------------------------------------------------------------
# LangGraph state schemas
# ---------------------------------------------------------------------------


class AgentState(TypedDict):
    """Shared state flowing through LangGraph nodes."""

    messages: Annotated[list[BaseMessage], add_messages]
    course_preferences: CoursePreferences
    syllabus: dict[str, Any] | None  # from Stage 1
    outline: list[LessonOutline]
    lessons: list[Lesson]
    quizzes: list[Quiz]
    current_step: str
    validation_result: dict[str, Any] | None
    retry_count: int
    student_profile: dict[str, Any]


class LessonWriterState(TypedDict):
    """State for the lesson writer sub-graph."""

    messages: Annotated[list[BaseMessage], add_messages]
    outline: LessonOutline
    course_preferences: CoursePreferences
    previous_lesson_titles: list[str]
    prior_concepts: list[str]       # concepts covered in prior lessons
    depth_calibration: str          # from syllabus depth_calibration
    draft_content: str
    interactive_elements: list[dict[str, Any]]
    validation_result: dict[str, Any] | None
    retry_count: int
    lesson: Lesson | None


class QuizGeneratorState(TypedDict):
    """State for the quiz generator sub-graph."""

    messages: Annotated[list[BaseMessage], add_messages]
    lesson: Lesson
    course_preferences: CoursePreferences
    key_concepts: list[str]
    questions: list[dict[str, Any]]
    validation_result: dict[str, Any] | None
    retry_count: int
    quiz: Quiz | None


class TutorState(TypedDict):
    """State for the tutor agent sub-graph."""

    messages: Annotated[list[BaseMessage], add_messages]
    student_profile: dict[str, Any]
    quiz_scores: list[float]
    missed_questions: list[dict[str, Any]]   # {question, student_answer, correct_answer, concept}
    time_per_lesson: dict[str, Any]          # lesson title → seconds spent
    assessment: dict[str, Any] | None
    action_plan: dict[str, Any] | None
    feedback: str
    adaptations: dict[str, Any]


# ---------------------------------------------------------------------------
# Streaming progress events (sent to frontend via SSE)
# ---------------------------------------------------------------------------


class AgentStep(BaseModel):
    """A single progress event emitted during course generation."""

    type: Literal[
        "planning",
        "outline_ready",
        "generating_lesson",
        "lesson_ready",
        "generating_quiz",
        "quiz_ready",
        "tutor_feedback",
        "complete",
        "error",
    ]
    message: str
    data: dict[str, Any] | None = Field(default=None)
