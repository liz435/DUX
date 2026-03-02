"""Assessment-focused LangChain tools for the quiz generator agent."""

from __future__ import annotations

from langchain_core.tools import tool


@tool
def generate_distractor_options(
    question: str, correct_answer: str, count: int = 3
) -> list[str]:
    """Create plausible wrong answers for a multiple-choice question.

    Returns a list of `count` distractor strings.
    """
    # Placeholder — in production this calls an LLM to generate plausible distractors.
    return [f"Distractor {i + 1} for: {question}" for i in range(count)]


@tool
def evaluate_short_answer(
    question: str, expected: str, student_answer: str
) -> dict[str, object]:
    """Grade a short-answer response.

    Returns {score: float 0-1, feedback: str}.
    """
    # Simple heuristic: keyword overlap. Production uses LLM grading.
    expected_words = set(expected.lower().split())
    student_words = set(student_answer.lower().split())
    if not expected_words:
        return {"score": 0.0, "feedback": "No expected answer to compare against."}
    overlap = len(expected_words & student_words) / len(expected_words)
    feedback = (
        "Good answer!" if overlap > 0.5 else "Consider reviewing the key concepts."
    )
    return {"score": round(min(overlap, 1.0), 2), "feedback": feedback}


@tool
def calculate_difficulty(question: str, options: list[str]) -> int:
    """Rate question difficulty on a 1-5 scale.

    Considers question length, number of options, and keyword complexity.
    """
    # Simple heuristic. Production uses an LLM judge.
    base = 2
    if len(question) > 100:
        base += 1
    if options and len(options) > 3:
        base += 1
    if any(kw in question.lower() for kw in ("explain", "analyze", "evaluate", "design")):
        base += 1
    return min(base, 5)


def get_assessment_tools() -> list:
    """Return the assessment tool set for binding to agents."""
    return [generate_distractor_options, evaluate_short_answer, calculate_difficulty]
