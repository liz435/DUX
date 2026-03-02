"""Evaluation tests for lesson writer quality."""

from __future__ import annotations

from pathlib import Path

from app.agents.graphs.lesson_writer import build_lesson_writer_graph
from app.eval.metrics import lesson_quality_score
from app.eval.runner import load_dataset, run_eval
from app.models.course import CoursePreferences, Lesson, LessonOutline

DATASET_PATH = Path(__file__).parent / "datasets" / "lesson_eval.json"


def _run_writer(input_data: dict) -> Lesson:
    prefs = CoursePreferences(
        topic=input_data["topic"],
        level=input_data["level"],
        course_length="quick",
        learning_style="mixed",
    )
    outline = LessonOutline(
        index=0,
        title=input_data["title"],
        summary=f"Lesson on {input_data['title']}",
        key_topics=input_data["key_topics"],
        has_quiz=False,
        estimated_minutes=15,
    )
    graph = build_lesson_writer_graph().compile()
    result = graph.invoke(
        {
            "messages": [],
            "outline": outline,
            "course_preferences": prefs,
            "previous_lesson_titles": [],
            "draft_content": "",
            "interactive_elements": [],
            "validation_result": None,
            "retry_count": 0,
            "lesson": None,
        }
    )
    return result["lesson"]


def _score_lesson(output: Lesson, criteria: dict) -> float:
    return lesson_quality_score(output, criteria)


class TestLessonEvalStructural:
    def test_structural_lesson_eval(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        result = run_eval(_run_writer, dataset, _score_lesson, threshold=0.6)
        assert result.mean_score >= 0.7, (
            f"Mean lesson quality {result.mean_score} < 0.7. "
            f"Failures: {result.failures}"
        )

    def test_all_lessons_have_content(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        for example in dataset:
            lesson = _run_writer(example.input)
            assert len(lesson.content) > 50, (
                f"Lesson '{example.input['title']}' has insufficient content"
            )

    def test_all_lessons_have_interactive_elements(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        for example in dataset:
            lesson = _run_writer(example.input)
            assert len(lesson.interactive_elements) >= 1, (
                f"Lesson '{example.input['title']}' has no interactive elements"
            )
