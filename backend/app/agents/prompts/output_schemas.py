"""Pydantic models used as structured output targets for LLM calls."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class OutlineItem(BaseModel):
    """A single lesson outline item — used for structured output."""

    index: int
    title: str
    summary: str
    key_topics: list[str] = Field(min_length=2, max_length=6)
    has_quiz: bool
    estimated_minutes: int = Field(ge=5, le=60)


class OutlineOutput(BaseModel):
    """Structured output for the course planner."""

    lessons: list[OutlineItem]


class QuizQuestionOutput(BaseModel):
    """A single quiz question — structured output."""

    id: str
    question: str
    question_type: Literal["multiple-choice", "true-false", "short-answer"]
    options: list[dict[str, str]] | None = None
    correct_answer: str
    explanation: str


class QuizOutput(BaseModel):
    """Structured output for the quiz generator."""

    questions: list[QuizQuestionOutput]


class ValidationOutput(BaseModel):
    """Structured output for the validation / review step."""

    valid: bool
    issues: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class TutorOutput(BaseModel):
    """Structured output for the tutor agent."""

    feedback: str
    adaptations: dict[str, object] = Field(default_factory=dict)


class InteractiveElementOutput(BaseModel):
    """Structured output for inline knowledge-check schema generation."""

    title: str
    description: str
    fields: list[dict[str, object]]
