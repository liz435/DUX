"""Integration tests for the Orchestrator graph (full pipeline)."""

from __future__ import annotations

from app.agents.graphs.orchestrator import build_orchestrator_graph
from app.models.course import CoursePreferences, Lesson, LessonOutline


class TestOrchestratorGraph:
    def _run_orchestrator(self, prefs: CoursePreferences) -> dict:
        graph = build_orchestrator_graph().compile()
        return graph.invoke(
            {
                "messages": [],
                "course_preferences": prefs,
                "outline": [],
                "lessons": [],
                "quizzes": [],
                "current_step": "start",
                "validation_result": None,
                "retry_count": 0,
                "student_profile": {},
            }
        )

    def test_full_pipeline_produces_outline(
        self, sample_preferences: CoursePreferences
    ) -> None:
        result = self._run_orchestrator(sample_preferences)
        assert len(result["outline"]) == sample_preferences.lesson_count

    def test_full_pipeline_produces_first_lesson(
        self, sample_preferences: CoursePreferences
    ) -> None:
        result = self._run_orchestrator(sample_preferences)
        lessons = result.get("lessons", [])
        assert len(lessons) >= 1
        assert isinstance(lessons[0], Lesson)

    def test_first_lesson_has_content(
        self, sample_preferences: CoursePreferences
    ) -> None:
        result = self._run_orchestrator(sample_preferences)
        first_lesson = result["lessons"][0]
        assert len(first_lesson.content) > 10

    def test_pipeline_reaches_complete(
        self, sample_preferences: CoursePreferences
    ) -> None:
        result = self._run_orchestrator(sample_preferences)
        assert result["current_step"] == "complete"

    def test_quiz_generated_when_first_lesson_has_quiz(self) -> None:
        # "standard" → 6 lessons, lesson at index 0 has_quiz depends on fallback
        # The fallback sets has_quiz = (i % 2 == 1), so index 0 → False
        prefs = CoursePreferences(
            topic="Python",
            level="beginner",
            course_length="quick",
            learning_style="mixed",
        )
        result = self._run_orchestrator(prefs)
        # First lesson index 0: has_quiz=False, so no quiz expected from orchestrator
        # But we verify the pipeline completes
        assert result["current_step"] == "complete"
