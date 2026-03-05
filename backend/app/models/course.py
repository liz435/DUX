from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


class CoursePreferences(BaseModel):
    """User input for course generation."""

    topic: str = Field(min_length=1, max_length=200)
    level: Literal["beginner", "intermediate", "advanced"]
    course_length: Literal["quick", "standard", "deep-dive"]
    learning_style: Literal["conceptual", "hands-on", "mixed"]

    @property
    def lesson_count(self) -> int:
        return {"quick": 3, "standard": 6, "deep-dive": 10}[self.course_length]


class LessonOutline(BaseModel):
    """Lightweight lesson plan produced by the course planner."""

    index: int = Field(ge=0)
    title: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    key_topics: list[str] = Field(min_length=2, max_length=6)
    has_quiz: bool
    estimated_minutes: int = Field(ge=1, le=120)
    # v2 planner fields (optional for backward compat)
    module: str = ""
    prerequisites: list[int] = Field(default_factory=list)
    learning_objectives: list[dict[str, str]] = Field(default_factory=list)
    key_terms: list[str] = Field(default_factory=list)
    difficulty: float = 0.5


class Lesson(LessonOutline):
    """Full lesson with content, produced by the lesson writer."""

    content: str = ""
    interactive_elements: list[dict] = Field(default_factory=list)
    is_completed: bool = False
    is_unlocked: bool = False


class QuizQuestion(BaseModel):
    """A single quiz question."""

    id: str
    question: str = Field(min_length=1)
    question_type: Literal["multiple-choice", "true-false", "short-answer", "code-completion"]
    options: list[QuizOption] | None = None
    correct_answer: str = Field(min_length=1)
    explanation: str = Field(min_length=1)


class QuizOption(BaseModel):
    """A single option for a multiple-choice question."""

    value: str
    label: str


# Rebuild QuizQuestion now that QuizOption is defined
QuizQuestion.model_rebuild()


class Quiz(BaseModel):
    """A quiz tied to a specific lesson."""

    lesson_index: int = Field(ge=0)
    questions: list[QuizQuestion] = Field(min_length=1)


class Course(BaseModel):
    """Top-level course aggregate — the main entity the system produces."""

    id: str
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    topic: str
    level: Literal["beginner", "intermediate", "advanced"]
    lessons: list[Lesson] = Field(default_factory=list)
    quizzes: list[Quiz] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
