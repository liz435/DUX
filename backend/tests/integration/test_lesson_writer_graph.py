"""Integration tests for the Lesson Writer graph."""

from __future__ import annotations

from app.agents.graphs.lesson_writer import build_lesson_writer_graph
from app.models.course import CoursePreferences, Lesson, LessonOutline


class TestLessonWriterGraph:
    def _run_writer(
        self,
        outline: LessonOutline,
        prefs: CoursePreferences,
        previous_titles: list[str] | None = None,
    ) -> dict:
        graph = build_lesson_writer_graph().compile()
        return graph.invoke(
            {
                "messages": [],
                "outline": outline,
                "course_preferences": prefs,
                "previous_lesson_titles": previous_titles or [],
                "draft_content": "",
                "interactive_elements": [],
                "validation_result": None,
                "retry_count": 0,
                "lesson": None,
            }
        )

    def test_produces_lesson(
        self,
        sample_outline: list[LessonOutline],
        sample_preferences: CoursePreferences,
    ) -> None:
        result = self._run_writer(sample_outline[0], sample_preferences)
        lesson = result.get("lesson")
        assert lesson is not None
        assert isinstance(lesson, Lesson)

    def test_lesson_has_content(
        self,
        sample_outline: list[LessonOutline],
        sample_preferences: CoursePreferences,
    ) -> None:
        result = self._run_writer(sample_outline[0], sample_preferences)
        lesson = result["lesson"]
        assert len(lesson.content) > 50

    def test_lesson_has_interactive_elements(
        self,
        sample_outline: list[LessonOutline],
        sample_preferences: CoursePreferences,
    ) -> None:
        result = self._run_writer(sample_outline[0], sample_preferences)
        lesson = result["lesson"]
        assert len(lesson.interactive_elements) >= 1

    def test_lesson_preserves_outline_fields(
        self,
        sample_outline: list[LessonOutline],
        sample_preferences: CoursePreferences,
    ) -> None:
        outline = sample_outline[0]
        result = self._run_writer(outline, sample_preferences)
        lesson = result["lesson"]
        assert lesson.title == outline.title
        assert lesson.index == outline.index
        assert lesson.key_topics == outline.key_topics

    def test_lesson_with_previous_titles(
        self,
        sample_outline: list[LessonOutline],
        sample_preferences: CoursePreferences,
    ) -> None:
        result = self._run_writer(
            sample_outline[1],
            sample_preferences,
            previous_titles=["Intro to Decorators"],
        )
        lesson = result["lesson"]
        assert lesson is not None
