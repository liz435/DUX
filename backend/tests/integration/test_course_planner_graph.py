"""Integration tests for the Course Planner graph."""

from __future__ import annotations

from app.agents.graphs.course_planner import build_course_planner_graph
from app.models.course import CoursePreferences, LessonOutline


class TestCoursePlannerGraph:
    def _run_planner(self, prefs: CoursePreferences) -> dict:
        graph = build_course_planner_graph().compile()
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

    def test_quick_course_produces_3_lessons(
        self, sample_preferences: CoursePreferences
    ) -> None:
        result = self._run_planner(sample_preferences)
        outlines = result["outline"]
        assert len(outlines) == 3
        assert all(isinstance(o, LessonOutline) for o in outlines)

    def test_standard_course_produces_6_lessons(self) -> None:
        prefs = CoursePreferences(
            topic="React", level="beginner", course_length="standard", learning_style="mixed"
        )
        result = self._run_planner(prefs)
        assert len(result["outline"]) == 6

    def test_deep_dive_course_produces_10_lessons(self) -> None:
        prefs = CoursePreferences(
            topic="ML", level="advanced", course_length="deep-dive", learning_style="conceptual"
        )
        result = self._run_planner(prefs)
        assert len(result["outline"]) == 10

    def test_outlines_have_sequential_indices(
        self, sample_preferences: CoursePreferences
    ) -> None:
        result = self._run_planner(sample_preferences)
        indices = [o.index for o in result["outline"]]
        assert indices == list(range(len(indices)))

    def test_outlines_have_unique_titles(
        self, sample_preferences: CoursePreferences
    ) -> None:
        result = self._run_planner(sample_preferences)
        titles = [o.title for o in result["outline"]]
        assert len(set(titles)) == len(titles)

    def test_each_outline_has_key_topics(
        self, sample_preferences: CoursePreferences
    ) -> None:
        result = self._run_planner(sample_preferences)
        for o in result["outline"]:
            assert len(o.key_topics) >= 2

    def test_finalized_step(
        self, sample_preferences: CoursePreferences
    ) -> None:
        result = self._run_planner(sample_preferences)
        assert result["current_step"] == "finalized"
