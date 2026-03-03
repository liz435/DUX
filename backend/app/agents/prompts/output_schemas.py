"""Pydantic models used as structured output targets for LLM calls."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Stage 1 — Syllabus Architect
# ---------------------------------------------------------------------------


class LessonObjective(BaseModel):
    objective: str
    blooms_level: str


class SyllabusScope(BaseModel):
    in_scope: list[str] = Field(default_factory=list)
    out_of_scope: list[str] = Field(default_factory=list)
    prerequisites: list[str] = Field(default_factory=list)


class SyllabusModule(BaseModel):
    title: str
    goal: str
    lesson_indices: list[int] = Field(default_factory=list)
    skills_gained: list[str] = Field(default_factory=list)


class DepthCalibration(BaseModel):
    vocabulary_policy: str = ""
    abstraction_level: str = ""
    code_complexity: str = ""
    depth_examples: list[str] = Field(default_factory=list)


class SyllabusOutput(BaseModel):
    """Structured output for the syllabus architect (Stage 1)."""

    scope: SyllabusScope = Field(default_factory=SyllabusScope)
    learning_objectives: list[LessonObjective] = Field(default_factory=list)
    modules: list[SyllabusModule] = Field(default_factory=list)
    prerequisite_chain: dict[str, list[int]] = Field(default_factory=dict)
    depth_calibration: DepthCalibration = Field(default_factory=DepthCalibration)


# ---------------------------------------------------------------------------
# Stage 2 — Course Planner
# ---------------------------------------------------------------------------


class OutlineItem(BaseModel):
    """A single lesson outline item — used for structured output."""

    index: int
    title: str
    module: str = ""
    prerequisites: list[int] = Field(default_factory=list)
    learning_objectives: list[LessonObjective] = Field(default_factory=list)
    summary: str
    key_topics: list[str] = Field(min_length=2, max_length=6)
    key_terms: list[str] = Field(default_factory=list)
    has_quiz: bool
    estimated_minutes: int = Field(ge=5, le=60)
    difficulty: float = Field(default=0.5, ge=0.0, le=1.0)


class OutlineOutput(BaseModel):
    """Structured output for the course planner."""

    lessons: list[OutlineItem]


# ---------------------------------------------------------------------------
# Stage 4 — Quiz Generator
# ---------------------------------------------------------------------------


class QuizQuestionOutput(BaseModel):
    """A single quiz question — structured output."""

    id: str
    question: str
    question_type: Literal["multiple-choice", "true-false", "short-answer", "code-completion"]
    blooms_level: str = ""
    maps_to_objective: str = ""
    options: list[dict[str, str]] | None = None
    correct_answer: str
    acceptable_alternatives: list[str] | None = None
    explanation: str
    difficulty: float = Field(default=0.5, ge=0.0, le=1.0)


class QuizOutput(BaseModel):
    """Structured output for the quiz generator."""

    questions: list[QuizQuestionOutput]


# ---------------------------------------------------------------------------
# Stage 5 — Interactive Element Generator
# ---------------------------------------------------------------------------


class InteractiveElementOutput(BaseModel):
    """Structured output for inline knowledge-check schema generation."""

    title: str
    description: str
    fields: list[dict[str, object]]
    correct_answer: dict[str, object] = Field(default_factory=dict)
    explanation: str = ""


# ---------------------------------------------------------------------------
# Stage 6 — Adaptive Tutor
# ---------------------------------------------------------------------------


class TutorErrorPattern(BaseModel):
    pattern: str
    affected_concepts: list[str] = Field(default_factory=list)
    root_cause: str = ""
    remediation: str = ""


class TutorOutput(BaseModel):
    """Structured output for the tutor agent."""

    overall_assessment: str = ""
    score_trend: Literal["improving", "declining", "stable", "insufficient_data"] = "insufficient_data"
    error_patterns: list[TutorErrorPattern] = Field(default_factory=list)
    feedback: str
    adaptations: dict[str, object] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Legacy — deterministic validation (not LLM-driven)
# ---------------------------------------------------------------------------


class ValidationOutput(BaseModel):
    """Structured output for the validation / review step."""

    valid: bool
    issues: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
