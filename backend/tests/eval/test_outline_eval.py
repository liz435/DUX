"""Evaluation tests for the course planner outline quality."""

from __future__ import annotations

from pathlib import Path

from app.agents.graphs.course_planner import build_course_planner_graph
from app.eval.metrics import outline_quality_score
from app.eval.runner import EvalExample, load_dataset, run_eval
from app.models.course import CoursePreferences, LessonOutline

DATASET_PATH = Path(__file__).parent / "datasets" / "outline_eval.json"


def _run_planner(input_data: dict) -> list[LessonOutline]:
    prefs = CoursePreferences(**input_data)
    graph = build_course_planner_graph().compile()
    result = graph.invoke(
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
    return result["outline"]


def _score_outline(output: list[LessonOutline], criteria: dict) -> float:
    return outline_quality_score(output, criteria)


class TestOutlineEvalStructural:
    def test_structural_outline_eval(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        result = run_eval(_run_planner, dataset, _score_outline, threshold=0.6)
        assert result.mean_score >= 0.7, (
            f"Mean outline quality {result.mean_score} < 0.7. "
            f"Failures: {result.failures}"
        )

    def test_all_outlines_have_correct_count(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        for example in dataset:
            outlines = _run_planner(example.input)
            expected = {"quick": 3, "standard": 6, "deep-dive": 10}[
                example.input["course_length"]
            ]
            assert len(outlines) == expected, (
                f"Expected {expected} lessons for {example.input['topic']}, "
                f"got {len(outlines)}"
            )

    def test_all_outlines_have_sequential_indices(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        for example in dataset:
            outlines = _run_planner(example.input)
            indices = [o.index for o in outlines]
            assert indices == list(range(len(outlines)))
