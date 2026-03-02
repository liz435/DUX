"""Integration tests for the Quiz Generator graph."""

from __future__ import annotations

from app.agents.graphs.quiz_generator import build_quiz_generator_graph
from app.models.course import CoursePreferences, Lesson, LessonOutline, Quiz


class TestQuizGeneratorGraph:
    def _make_lesson(self, prefs: CoursePreferences) -> Lesson:
        return Lesson(
            index=0,
            title="Test Lesson",
            summary="A test lesson for quiz generation.",
            key_topics=["decorators", "closures", "functools"],
            has_quiz=True,
            estimated_minutes=15,
            content="## Test Lesson\n\nContent about decorators and closures.",
            interactive_elements=[],
        )

    def _run_quiz_gen(self, lesson: Lesson, prefs: CoursePreferences) -> dict:
        graph = build_quiz_generator_graph().compile()
        return graph.invoke(
            {
                "messages": [],
                "lesson": lesson,
                "course_preferences": prefs,
                "key_concepts": lesson.key_topics,
                "questions": [],
                "validation_result": None,
                "retry_count": 0,
                "quiz": None,
            }
        )

    def test_produces_quiz(self, sample_preferences: CoursePreferences) -> None:
        lesson = self._make_lesson(sample_preferences)
        result = self._run_quiz_gen(lesson, sample_preferences)
        quiz = result.get("quiz")
        assert quiz is not None
        assert isinstance(quiz, Quiz)

    def test_quiz_has_questions(self, sample_preferences: CoursePreferences) -> None:
        lesson = self._make_lesson(sample_preferences)
        result = self._run_quiz_gen(lesson, sample_preferences)
        quiz = result["quiz"]
        assert len(quiz.questions) >= 1

    def test_quiz_questions_have_correct_answers(
        self, sample_preferences: CoursePreferences
    ) -> None:
        lesson = self._make_lesson(sample_preferences)
        result = self._run_quiz_gen(lesson, sample_preferences)
        quiz = result["quiz"]
        for q in quiz.questions:
            assert q.correct_answer != ""

    def test_quiz_lesson_index_matches(
        self, sample_preferences: CoursePreferences
    ) -> None:
        lesson = self._make_lesson(sample_preferences)
        result = self._run_quiz_gen(lesson, sample_preferences)
        quiz = result["quiz"]
        assert quiz.lesson_index == lesson.index

    def test_quiz_has_mixed_question_types(
        self, sample_preferences: CoursePreferences
    ) -> None:
        lesson = self._make_lesson(sample_preferences)
        result = self._run_quiz_gen(lesson, sample_preferences)
        quiz = result["quiz"]
        types = {q.question_type for q in quiz.questions}
        # Should have at least 2 different types
        assert len(types) >= 2

    def test_quiz_questions_have_explanations(
        self, sample_preferences: CoursePreferences
    ) -> None:
        lesson = self._make_lesson(sample_preferences)
        result = self._run_quiz_gen(lesson, sample_preferences)
        quiz = result["quiz"]
        for q in quiz.questions:
            assert q.explanation != ""
