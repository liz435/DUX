from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.models.course import Course, CoursePreferences, Lesson, Quiz


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class CreateCourseRequest(BaseModel):
    """POST /api/courses — kick off course generation."""

    preferences: CoursePreferences


class GenerateLessonRequest(BaseModel):
    """POST /api/courses/{id}/lessons/{idx}/generate — on-demand lesson."""

    pass


class GenerateQuizRequest(BaseModel):
    """POST /api/courses/{id}/quizzes/{idx}/generate — on-demand quiz."""

    pass


class GradeQuizRequest(BaseModel):
    """POST /api/courses/{id}/quizzes/{idx}/grade — submit answers."""

    answers: dict[str, str] = Field(
        ..., description="Map of question_id -> user answer"
    )


class SubmitFeedbackRequest(BaseModel):
    """POST /api/courses/{id}/feedback — user interaction data."""

    lesson_index: int
    interaction_type: str
    data: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class CreateCourseResponse(BaseModel):
    """Response for course creation — returns ID for SSE streaming."""

    course_id: str
    status: str = "generating"


class CourseResponse(BaseModel):
    """Full course data response."""

    course: Course


class LessonResponse(BaseModel):
    """Single lesson response."""

    lesson: Lesson


class QuizResponse(BaseModel):
    """Single quiz response."""

    quiz: Quiz


class GradeResult(BaseModel):
    """Result of grading a quiz submission."""

    score: float = Field(ge=0.0, le=1.0)
    total_questions: int
    correct_count: int
    results: list[QuestionResult]


class QuestionResult(BaseModel):
    """Per-question grading detail."""

    question_id: str
    correct: bool
    user_answer: str
    correct_answer: str
    explanation: str


class FeedbackResponse(BaseModel):
    """Tutor feedback after user interaction."""

    message: str
    adaptations: dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    """GET /api/health response."""

    status: str = "ok"
    version: str = "0.1.0"
