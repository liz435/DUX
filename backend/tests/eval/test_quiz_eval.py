"""Evaluation tests for quiz generator quality."""

from __future__ import annotations

from pathlib import Path

from app.agents.graphs.quiz_generator import build_quiz_generator_graph
from app.eval.metrics import quiz_validity_score
from app.eval.runner import load_dataset, run_eval
from app.models.course import CoursePreferences, Lesson, Quiz

DATASET_PATH = Path(__file__).parent / "datasets" / "quiz_eval.json"


def _run_quiz_gen(input_data: dict) -> Quiz:
    prefs = CoursePreferences(
        topic=input_data["topic"],
        level=input_data["level"],
        course_length="quick",
        learning_style="mixed",
    )
    lesson = Lesson(
        index=0,
        title=f"Lesson on {input_data['topic']}",
        summary=f"Covers {', '.join(input_data['key_concepts'])}",
        key_topics=input_data["key_concepts"],
        has_quiz=True,
        estimated_minutes=15,
        content=f"## {input_data['topic']}\n\nContent about {', '.join(input_data['key_concepts'])}.",
    )
    graph = build_quiz_generator_graph().compile()
    result = graph.invoke(
        {
            "messages": [],
            "lesson": lesson,
            "course_preferences": prefs,
            "key_concepts": input_data["key_concepts"],
            "questions": [],
            "validation_result": None,
            "retry_count": 0,
            "quiz": None,
        }
    )
    return result["quiz"]


def _score_quiz(output: Quiz, criteria: dict) -> float:
    return quiz_validity_score(output, criteria)


class TestQuizEvalStructural:
    def test_structural_quiz_eval(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        result = run_eval(_run_quiz_gen, dataset, _score_quiz, threshold=0.6)
        assert result.mean_score >= 0.7, (
            f"Mean quiz validity {result.mean_score} < 0.7. "
            f"Failures: {result.failures}"
        )

    def test_all_quizzes_have_questions(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        for example in dataset:
            quiz = _run_quiz_gen(example.input)
            assert len(quiz.questions) >= 1, (
                f"Quiz for '{example.input['topic']}' has no questions"
            )

    def test_all_quizzes_have_correct_answers(self) -> None:
        dataset = load_dataset(DATASET_PATH)
        for example in dataset:
            quiz = _run_quiz_gen(example.input)
            for q in quiz.questions:
                assert q.correct_answer, (
                    f"Question '{q.id}' has no correct_answer"
                )
