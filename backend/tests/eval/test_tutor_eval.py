"""Evaluation tests for tutor agent quality."""

from __future__ import annotations

from pathlib import Path

from app.agents.graphs.tutor import build_tutor_graph
from app.eval.metrics import tutor_adaptation_score
from app.eval.runner import load_dataset, run_eval

DATASET_PATH = Path(__file__).parent / "datasets" / "tutor_eval.json"


def _run_tutor(input_data: dict) -> dict:
    graph = build_tutor_graph().compile()
    result = graph.invoke(
        {
            "messages": [],
            "student_profile": {
                "level": input_data["level"],
                "completed_lessons": input_data["completed_lessons"],
                "total_lessons": input_data["total_lessons"],
                "topic_scores": {},
            },
            "quiz_scores": input_data["quiz_scores"],
            "assessment": None,
            "action_plan": None,
            "feedback": "",
            "adaptations": {},
        }
    )
    return {
        "feedback": result.get("feedback", ""),
        "adaptations": result.get("adaptations", {}),
    }


def _score_tutor(output: dict, criteria: dict) -> float:
    return tutor_adaptation_score(
        output["feedback"], output["adaptations"], criteria
    )


class TestTutorEvalStructural:
    def test_structural_tutor_eval(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        result = run_eval(_run_tutor, dataset, _score_tutor, threshold=0.5)
        assert result.mean_score >= 0.6, (
            f"Mean tutor score {result.mean_score} < 0.6. "
            f"Failures: {result.failures}"
        )

    def test_all_produce_feedback(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        for example in dataset:
            output = _run_tutor(example.input)
            assert len(output["feedback"]) > 0, "Tutor produced empty feedback"

    def test_all_produce_adaptations(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        for example in dataset:
            output = _run_tutor(example.input)
            assert len(output["adaptations"]) > 0, "Tutor produced no adaptations"
