from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models.agent import AgentStep
from app.models.course import (
    Course,
    CoursePreferences,
    Lesson,
    LessonOutline,
    Quiz,
    QuizOption,
    QuizQuestion,
)


class TestCoursePreferences:
    def test_valid_preferences(self, sample_preferences: CoursePreferences) -> None:
        assert sample_preferences.topic == "Python decorators"
        assert sample_preferences.level == "intermediate"
        assert sample_preferences.lesson_count == 3

    def test_lesson_count_mapping(self) -> None:
        for length, expected in [("quick", 3), ("standard", 6), ("deep-dive", 10)]:
            prefs = CoursePreferences(
                topic="test", level="beginner", course_length=length, learning_style="mixed"
            )
            assert prefs.lesson_count == expected

    def test_empty_topic_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CoursePreferences(
                topic="", level="beginner", course_length="quick", learning_style="mixed"
            )

    def test_invalid_level_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CoursePreferences(
                topic="test", level="expert", course_length="quick", learning_style="mixed"
            )

    def test_invalid_course_length_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CoursePreferences(
                topic="test", level="beginner", course_length="mega", learning_style="mixed"
            )


class TestLessonOutline:
    def test_valid_outline(self, sample_outline: list[LessonOutline]) -> None:
        assert len(sample_outline) == 3
        assert sample_outline[0].title == "Introduction to Decorators"
        assert not sample_outline[0].has_quiz
        assert sample_outline[1].has_quiz

    def test_key_topics_min_length(self) -> None:
        with pytest.raises(ValidationError):
            LessonOutline(
                index=0,
                title="Test",
                summary="Test summary",
                key_topics=["only-one"],
                has_quiz=False,
                estimated_minutes=10,
            )

    def test_negative_index_rejected(self) -> None:
        with pytest.raises(ValidationError):
            LessonOutline(
                index=-1,
                title="Test",
                summary="Test summary",
                key_topics=["a", "b"],
                has_quiz=False,
                estimated_minutes=10,
            )


class TestLesson:
    def test_lesson_extends_outline(self, sample_outline: list[LessonOutline]) -> None:
        outline = sample_outline[0]
        lesson = Lesson(**outline.model_dump(), content="# Test", is_unlocked=True)
        assert lesson.title == outline.title
        assert lesson.content == "# Test"
        assert lesson.is_unlocked is True
        assert lesson.is_completed is False

    def test_lesson_defaults(self, sample_outline: list[LessonOutline]) -> None:
        lesson = Lesson(**sample_outline[0].model_dump())
        assert lesson.content == ""
        assert lesson.interactive_elements == []
        assert lesson.is_completed is False
        assert lesson.is_unlocked is False


class TestQuizQuestion:
    def test_valid_mc_question(self) -> None:
        q = QuizQuestion(
            id="q1",
            question="What is 2+2?",
            question_type="multiple-choice",
            options=[
                QuizOption(value="3", label="Three"),
                QuizOption(value="4", label="Four"),
            ],
            correct_answer="4",
            explanation="Basic arithmetic.",
        )
        assert q.question_type == "multiple-choice"
        assert len(q.options) == 2

    def test_valid_true_false(self) -> None:
        q = QuizQuestion(
            id="q2",
            question="The sky is blue.",
            question_type="true-false",
            correct_answer="true",
            explanation="Generally yes.",
        )
        assert q.options is None

    def test_invalid_question_type(self) -> None:
        with pytest.raises(ValidationError):
            QuizQuestion(
                id="q3",
                question="Test?",
                question_type="essay",
                correct_answer="answer",
                explanation="explanation",
            )

    def test_empty_question_rejected(self) -> None:
        with pytest.raises(ValidationError):
            QuizQuestion(
                id="q4",
                question="",
                question_type="short-answer",
                correct_answer="answer",
                explanation="explanation",
            )


class TestQuiz:
    def test_valid_quiz(self, sample_quiz: Quiz) -> None:
        assert sample_quiz.lesson_index == 1
        assert len(sample_quiz.questions) == 2

    def test_empty_questions_rejected(self) -> None:
        with pytest.raises(ValidationError):
            Quiz(lesson_index=0, questions=[])


class TestCourse:
    def test_valid_course(self, sample_course: Course) -> None:
        assert sample_course.id == "test-course-001"
        assert len(sample_course.lessons) == 3
        assert len(sample_course.quizzes) == 1
        assert sample_course.lessons[0].is_unlocked is True
        assert sample_course.lessons[1].is_unlocked is False


class TestAgentStep:
    def test_valid_step(self) -> None:
        step = AgentStep(type="planning", message="Planning course...")
        assert step.type == "planning"
        assert step.data is None

    def test_step_with_data(self) -> None:
        step = AgentStep(
            type="lesson_ready",
            message="Lesson 1 ready",
            data={"lesson_index": 0},
        )
        assert step.data == {"lesson_index": 0}

    def test_invalid_step_type(self) -> None:
        with pytest.raises(ValidationError):
            AgentStep(type="unknown", message="test")

    def test_step_serialization(self) -> None:
        step = AgentStep(type="complete", message="Done!", data={"course_id": "abc"})
        json_str = step.model_dump_json()
        assert "complete" in json_str
        assert "abc" in json_str
