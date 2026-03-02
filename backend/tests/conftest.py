from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.course import (
    Course,
    CoursePreferences,
    Lesson,
    LessonOutline,
    Quiz,
    QuizOption,
    QuizQuestion,
)


@pytest.fixture
def test_client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_preferences() -> CoursePreferences:
    return CoursePreferences(
        topic="Python decorators",
        level="intermediate",
        course_length="quick",
        learning_style="mixed",
    )


@pytest.fixture
def sample_outline() -> list[LessonOutline]:
    return [
        LessonOutline(
            index=0,
            title="Introduction to Decorators",
            summary="What decorators are and why they exist.",
            key_topics=["functions as objects", "closures", "basic syntax"],
            has_quiz=False,
            estimated_minutes=15,
        ),
        LessonOutline(
            index=1,
            title="Writing Your Own Decorators",
            summary="Build custom decorators step by step.",
            key_topics=["wrapper functions", "functools.wraps", "arguments"],
            has_quiz=True,
            estimated_minutes=20,
        ),
        LessonOutline(
            index=2,
            title="Advanced Decorator Patterns",
            summary="Parameterized decorators, class decorators, and stacking.",
            key_topics=["parameterized", "class-based", "decorator stacking"],
            has_quiz=True,
            estimated_minutes=25,
        ),
    ]


@pytest.fixture
def sample_quiz() -> Quiz:
    return Quiz(
        lesson_index=1,
        questions=[
            QuizQuestion(
                id="q1",
                question="What does functools.wraps do?",
                question_type="multiple-choice",
                options=[
                    QuizOption(value="a", label="Preserves the wrapped function's metadata"),
                    QuizOption(value="b", label="Makes the function faster"),
                    QuizOption(value="c", label="Adds type checking"),
                ],
                correct_answer="a",
                explanation="functools.wraps copies the original function's name, docstring, and other attributes to the wrapper.",
            ),
            QuizQuestion(
                id="q2",
                question="A decorator is applied using the @ syntax.",
                question_type="true-false",
                options=[
                    QuizOption(value="true", label="True"),
                    QuizOption(value="false", label="False"),
                ],
                correct_answer="true",
                explanation="The @decorator syntax is syntactic sugar for func = decorator(func).",
            ),
        ],
    )


@pytest.fixture
def sample_course(sample_outline: list[LessonOutline], sample_quiz: Quiz) -> Course:
    lessons = [
        Lesson(
            **outline.model_dump(),
            content=f"# {outline.title}\n\nLesson content here.",
            interactive_elements=[],
            is_completed=False,
            is_unlocked=(outline.index == 0),
        )
        for outline in sample_outline
    ]
    return Course(
        id="test-course-001",
        title="Python Decorators",
        description="A quick intermediate course on Python decorators.",
        topic="Python decorators",
        level="intermediate",
        lessons=lessons,
        quizzes=[sample_quiz],
    )
