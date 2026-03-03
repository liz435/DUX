"""Unit tests for prompt templates and output schemas."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.agents.prompts.system_prompts import (
    SYLLABUS_ARCHITECT_SYSTEM,
    COURSE_PLANNER_SYSTEM,
    INTERACTIVE_ELEMENT_SYSTEM,
    LESSON_WRITER_SYSTEM,
    QUIZ_GENERATOR_SYSTEM,
    TUTOR_SYSTEM,
    VALIDATION_SYSTEM,
)
from app.agents.prompts.output_schemas import (
    InteractiveElementOutput,
    OutlineItem,
    OutlineOutput,
    QuizOutput,
    QuizQuestionOutput,
    TutorOutput,
    ValidationOutput,
)


class TestSystemPrompts:
    def test_syllabus_architect_prompt_renders(self) -> None:
        rendered = SYLLABUS_ARCHITECT_SYSTEM.format(
            topic="Python", level="beginner", learning_style="mixed",
            lesson_count=6, total_hours=2,
        )
        assert "Python" in rendered
        assert "beginner" in rendered

    def test_planner_prompt_renders(self) -> None:
        rendered = COURSE_PLANNER_SYSTEM.format(
            syllabus_json="{}", topic="Python",
            lesson_count=6, level="intermediate", learning_style="mixed",
        )
        assert "6" in rendered
        assert "intermediate" in rendered
        assert "mixed" in rendered

    def test_lesson_writer_prompt_renders(self) -> None:
        rendered = LESSON_WRITER_SYSTEM.format(
            topic="Python", index=0, title="Decorators", module="Basics",
            learning_objectives="- [Apply] Use decorators", key_topics="closures, wraps",
            key_terms="decorator, closure", level="beginner", learning_style="hands-on",
            previous_titles="None", prior_concepts="variables, functions",
            estimated_minutes=15, depth_calibration="Keep it simple.",
            interactive_count=2, min_examples=2,
        )
        assert "Python" in rendered
        assert "beginner" in rendered

    def test_quiz_prompt_renders(self) -> None:
        rendered = QUIZ_GENERATOR_SYSTEM.format(
            title="Decorators", lesson_summary="Covers decorator syntax.",
            key_concepts="closures, wraps, functools", key_terms="decorator",
            learning_objectives="- [Apply] Use decorators",
            level="advanced", question_count=5,
        )
        assert "5" in rendered
        assert "advanced" in rendered

    def test_tutor_prompt_renders(self) -> None:
        rendered = TUTOR_SYSTEM.format(
            level="intermediate", topic="Python",
            quiz_scores='{"Lesson 0": 0.7}',
            completed_count=3, total_lessons=6,
            missed_questions="[]", time_per_lesson="{}",
        )
        assert "intermediate" in rendered
        assert "Python" in rendered

    def test_interactive_prompt_renders(self) -> None:
        rendered = INTERACTIVE_ELEMENT_SYSTEM.format(
            context="Some lesson text about decorators",
            concept="decorator syntax", level="beginner",
        )
        assert "decorators" in rendered

    def test_validation_prompt_renders(self) -> None:
        rendered = VALIDATION_SYSTEM.format(
            level="beginner", content_type="lesson"
        )
        assert "beginner" in rendered


class TestOutputSchemas:
    def test_outline_item_valid(self) -> None:
        item = OutlineItem(
            index=0,
            title="Intro",
            summary="Introduction to the topic",
            key_topics=["a", "b", "c"],
            has_quiz=True,
            estimated_minutes=15,
        )
        assert item.index == 0

    def test_outline_item_min_topics(self) -> None:
        with pytest.raises(ValidationError):
            OutlineItem(
                index=0,
                title="Intro",
                summary="Summary",
                key_topics=["only-one"],
                has_quiz=False,
                estimated_minutes=10,
            )

    def test_outline_output(self) -> None:
        output = OutlineOutput(
            lessons=[
                OutlineItem(
                    index=0,
                    title="L1",
                    summary="S1",
                    key_topics=["a", "b"],
                    has_quiz=False,
                    estimated_minutes=10,
                )
            ]
        )
        assert len(output.lessons) == 1

    def test_quiz_question_output(self) -> None:
        q = QuizQuestionOutput(
            id="q1",
            question="What?",
            question_type="multiple-choice",
            options=[{"value": "a", "label": "A"}],
            correct_answer="a",
            explanation="Because.",
        )
        assert q.question_type == "multiple-choice"

    def test_quiz_output(self) -> None:
        output = QuizOutput(
            questions=[
                QuizQuestionOutput(
                    id="q1",
                    question="Q?",
                    question_type="true-false",
                    correct_answer="true",
                    explanation="Yes.",
                )
            ]
        )
        assert len(output.questions) == 1

    def test_validation_output(self) -> None:
        v = ValidationOutput(valid=True)
        assert v.issues == []
        assert v.suggestions == []

    def test_validation_output_with_issues(self) -> None:
        v = ValidationOutput(
            valid=False,
            issues=["Too short"],
            suggestions=["Add more content"],
        )
        assert not v.valid
        assert len(v.issues) == 1

    def test_tutor_output(self) -> None:
        t = TutorOutput(
            feedback="Great job!",
            adaptations={"speed_up": True},
        )
        assert t.feedback == "Great job!"

    def test_interactive_element_output(self) -> None:
        ie = InteractiveElementOutput(
            title="Check",
            description="Test yourself",
            fields=[{"id": "q1", "type": "text", "label": "Answer"}],
        )
        assert len(ie.fields) == 1
