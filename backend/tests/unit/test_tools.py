"""Unit tests for LangChain tools."""

from __future__ import annotations

from app.agents.tools.curriculum_tools import (
    check_prerequisite_coverage,
    get_curriculum_tools,
    get_learning_objectives,
    search_topic_info,
)
from app.agents.tools.content_tools import (
    generate_code_example,
    generate_interactive_schema,
    get_content_tools,
    validate_technical_accuracy,
)
from app.agents.tools.assessment_tools import (
    calculate_difficulty,
    evaluate_short_answer,
    generate_distractor_options,
    get_assessment_tools,
)


class TestCurriculumTools:
    def test_search_topic_info(self) -> None:
        result = search_topic_info.invoke({"query": "Python decorators"})
        assert "Python decorators" in result
        assert isinstance(result, str)

    def test_get_learning_objectives(self) -> None:
        result = get_learning_objectives.invoke(
            {"topic": "Python", "level": "beginner"}
        )
        assert isinstance(result, list)
        assert len(result) == 5
        assert "Define" in result[0]

    def test_get_learning_objectives_advanced(self) -> None:
        result = get_learning_objectives.invoke(
            {"topic": "ML", "level": "advanced"}
        )
        assert "Evaluate" in result[0]

    def test_check_prerequisite_first_lesson(self) -> None:
        result = check_prerequisite_coverage.invoke(
            {"lesson_titles": ["Intro"], "current_index": 0}
        )
        assert result["covered"] is True
        assert result["missing"] == []

    def test_check_prerequisite_later_lesson(self) -> None:
        result = check_prerequisite_coverage.invoke(
            {"lesson_titles": ["Intro", "Basics", "Advanced"], "current_index": 2}
        )
        assert result["covered"] is True
        assert result["prior_count"] == 2

    def test_get_curriculum_tools_returns_list(self) -> None:
        tools = get_curriculum_tools()
        assert len(tools) == 3


class TestContentTools:
    def test_generate_code_example(self) -> None:
        result = generate_code_example.invoke(
            {"topic": "Python", "language": "python", "concept": "decorators"}
        )
        assert "```python" in result
        assert "decorators" in result

    def test_validate_technical_accuracy(self) -> None:
        result = validate_technical_accuracy.invoke(
            {"claim": "Python uses indentation", "topic": "Python"}
        )
        assert result["valid"] is True

    def test_generate_interactive_schema_recall(self) -> None:
        result = generate_interactive_schema.invoke(
            {"context": "Some lesson text about decorators", "check_type": "recall"}
        )
        assert result["title"] == "Quick Check"
        assert len(result["fields"]) == 1
        assert result["fields"][0]["type"] == "single-choice"

    def test_generate_interactive_schema_reflection(self) -> None:
        result = generate_interactive_schema.invoke(
            {"context": "Lesson text", "check_type": "reflection"}
        )
        assert result["title"] == "Reflect"
        assert result["fields"][0]["type"] == "text"

    def test_generate_interactive_schema_exploration(self) -> None:
        result = generate_interactive_schema.invoke(
            {"context": "Lesson text", "check_type": "exploration"}
        )
        assert result["title"] == "Explore"
        assert result["fields"][0]["type"] == "slider"

    def test_get_content_tools_returns_list(self) -> None:
        tools = get_content_tools()
        assert len(tools) == 3


class TestAssessmentTools:
    def test_generate_distractor_options(self) -> None:
        result = generate_distractor_options.invoke(
            {"question": "What is X?", "correct_answer": "Y", "count": 3}
        )
        assert isinstance(result, list)
        assert len(result) == 3

    def test_evaluate_short_answer_good(self) -> None:
        result = evaluate_short_answer.invoke(
            {
                "question": "What is Python?",
                "expected": "Python is a programming language",
                "student_answer": "Python is a language for programming",
            }
        )
        assert result["score"] > 0.0
        assert "feedback" in result

    def test_evaluate_short_answer_poor(self) -> None:
        result = evaluate_short_answer.invoke(
            {
                "question": "What is Python?",
                "expected": "Python is a programming language",
                "student_answer": "I don't know",
            }
        )
        assert result["score"] < 0.5

    def test_calculate_difficulty_simple(self) -> None:
        result = calculate_difficulty.invoke(
            {"question": "What is 2+2?", "options": ["3", "4"]}
        )
        assert isinstance(result, int)
        assert 1 <= result <= 5

    def test_calculate_difficulty_complex(self) -> None:
        result = calculate_difficulty.invoke(
            {
                "question": "Analyze the performance implications of this design pattern and evaluate its trade-offs",
                "options": ["A", "B", "C", "D"],
            }
        )
        assert result >= 3

    def test_get_assessment_tools_returns_list(self) -> None:
        tools = get_assessment_tools()
        assert len(tools) == 3
