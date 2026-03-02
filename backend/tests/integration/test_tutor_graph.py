"""Integration tests for the Tutor Agent graph."""

from __future__ import annotations

from app.agents.graphs.tutor import build_tutor_graph


class TestTutorGraph:
    def _run_tutor(
        self,
        quiz_scores: list[float],
        student_profile: dict | None = None,
    ) -> dict:
        graph = build_tutor_graph().compile()
        return graph.invoke(
            {
                "messages": [],
                "student_profile": student_profile or {
                    "level": "intermediate",
                    "completed_lessons": 3,
                    "total_lessons": 6,
                    "topic_scores": {},
                },
                "quiz_scores": quiz_scores,
                "assessment": None,
                "action_plan": None,
                "feedback": "",
                "adaptations": {},
            }
        )

    def test_low_scores_trigger_supplement(self) -> None:
        result = self._run_tutor(quiz_scores=[0.4, 0.5, 0.3])
        assert result["adaptations"].get("adjust_depth") == "simpler"
        assert result["adaptations"].get("slow_down") is True
        assert len(result["feedback"]) > 0

    def test_high_scores_trigger_challenge(self) -> None:
        result = self._run_tutor(quiz_scores=[0.95, 0.98, 1.0])
        assert result["adaptations"].get("adjust_depth") == "deeper"
        assert result["adaptations"].get("speed_up") is True

    def test_medium_scores_continue(self) -> None:
        result = self._run_tutor(quiz_scores=[0.75, 0.80, 0.85])
        assert result["adaptations"].get("adjust_depth") == "maintain"

    def test_empty_scores_handled(self) -> None:
        result = self._run_tutor(quiz_scores=[])
        # No scores → low avg → supplement
        assert result["adaptations"].get("adjust_depth") == "simpler"

    def test_feedback_is_nonempty(self) -> None:
        result = self._run_tutor(quiz_scores=[0.7])
        assert isinstance(result["feedback"], str)
        assert len(result["feedback"]) > 10

    def test_weak_topics_identified(self) -> None:
        result = self._run_tutor(
            quiz_scores=[0.5],
            student_profile={
                "level": "beginner",
                "completed_lessons": 1,
                "total_lessons": 3,
                "topic_scores": {"decorators": 0.4, "closures": 0.9},
            },
        )
        assessment = result.get("assessment", {})
        assert "decorators" in assessment.get("weak_topics", [])
