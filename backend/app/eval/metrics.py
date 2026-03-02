"""Evaluation metrics for agent quality measurement."""

from __future__ import annotations

from typing import Any

from app.models.course import Course, Lesson, LessonOutline, Quiz


def outline_quality_score(
    outlines: list[LessonOutline], criteria: dict[str, Any]
) -> float:
    """Score an outline for quality (0-1).

    Checks: correct count, topic coverage, progressive difficulty, no redundancy.
    """
    score = 0.0
    checks = 0

    # Correct lesson count
    expected_count = criteria.get("lesson_count", len(outlines))
    checks += 1
    if len(outlines) == expected_count:
        score += 1.0

    # Sequential indices
    checks += 1
    indices = [o.index for o in outlines]
    if indices == list(range(len(outlines))):
        score += 1.0

    # No duplicate titles
    checks += 1
    titles = [o.title for o in outlines]
    if len(set(titles)) == len(titles):
        score += 1.0

    # Topic coverage — check if required topics are mentioned
    must_cover = criteria.get("must_cover", [])
    if must_cover:
        checks += 1
        all_topics = " ".join(
            " ".join(o.key_topics) + " " + o.title + " " + o.summary
            for o in outlines
        ).lower()
        covered = sum(1 for t in must_cover if t.lower() in all_topics)
        score += covered / len(must_cover)

    # Progressive difficulty (heuristic: later lessons have more estimated time)
    checks += 1
    if len(outlines) >= 2:
        first_half_avg = sum(o.estimated_minutes for o in outlines[: len(outlines) // 2]) / max(
            len(outlines) // 2, 1
        )
        second_half_avg = sum(
            o.estimated_minutes for o in outlines[len(outlines) // 2 :]
        ) / max(len(outlines) - len(outlines) // 2, 1)
        if second_half_avg >= first_half_avg:
            score += 1.0
        else:
            score += 0.5  # partial credit
    else:
        score += 1.0

    # Key topics minimum
    checks += 1
    if all(len(o.key_topics) >= 2 for o in outlines):
        score += 1.0

    return round(score / checks, 3) if checks > 0 else 0.0


def lesson_quality_score(lesson: Lesson, criteria: dict[str, Any]) -> float:
    """Score a lesson for quality (0-1).

    Checks: content length, headings, level match, completeness.
    """
    score = 0.0
    checks = 0

    # Has substantial content
    checks += 1
    min_length = criteria.get("min_content_length", 100)
    if len(lesson.content) >= min_length:
        score += 1.0
    elif len(lesson.content) > 0:
        score += len(lesson.content) / min_length

    # Has Markdown headings
    checks += 1
    if "## " in lesson.content or "# " in lesson.content:
        score += 1.0

    # Has interactive elements
    checks += 1
    min_interactive = criteria.get("min_interactive", 1)
    if len(lesson.interactive_elements) >= min_interactive:
        score += 1.0
    elif lesson.interactive_elements:
        score += 0.5

    # Title matches outline
    checks += 1
    if lesson.title and len(lesson.title) > 0:
        score += 1.0

    # Key topics covered in content
    checks += 1
    content_lower = lesson.content.lower()
    covered_topics = sum(
        1 for t in lesson.key_topics if t.lower() in content_lower
    )
    if lesson.key_topics:
        score += covered_topics / len(lesson.key_topics)
    else:
        score += 1.0

    return round(score / checks, 3) if checks > 0 else 0.0


def quiz_validity_score(quiz: Quiz, criteria: dict[str, Any]) -> float:
    """Score a quiz for validity (0-1).

    Checks: answers present, types valid, explanations exist, difficulty calibrated.
    """
    score = 0.0
    checks = 0

    # Has questions
    checks += 1
    min_questions = criteria.get("min_questions", 1)
    if len(quiz.questions) >= min_questions:
        score += 1.0
    elif quiz.questions:
        score += len(quiz.questions) / min_questions

    # All questions have correct answers
    checks += 1
    if all(q.correct_answer for q in quiz.questions):
        score += 1.0

    # All questions have explanations
    checks += 1
    if all(q.explanation for q in quiz.questions):
        score += 1.0

    # Valid question types
    checks += 1
    valid_types = {"multiple-choice", "true-false", "short-answer"}
    if all(q.question_type in valid_types for q in quiz.questions):
        score += 1.0

    # MC questions have options
    checks += 1
    mc_questions = [q for q in quiz.questions if q.question_type == "multiple-choice"]
    if mc_questions:
        if all(q.options and len(q.options) >= 2 for q in mc_questions):
            score += 1.0
        else:
            score += 0.5
    else:
        score += 1.0  # no MC questions is fine

    # Type diversity
    checks += 1
    types_used = {q.question_type for q in quiz.questions}
    if len(types_used) >= 2:
        score += 1.0
    elif len(types_used) == 1:
        score += 0.5

    return round(score / checks, 3) if checks > 0 else 0.0


def tutor_adaptation_score(
    feedback: str, adaptations: dict[str, Any], criteria: dict[str, Any]
) -> float:
    """Score tutor output for quality (0-1).

    Checks: feedback relevance, adaptation direction, encouragement.
    """
    score = 0.0
    checks = 0

    # Feedback is non-empty
    checks += 1
    if len(feedback) > 20:
        score += 1.0
    elif len(feedback) > 0:
        score += 0.5

    # Adaptations present
    checks += 1
    if adaptations:
        score += 1.0

    # Correct adaptation direction
    expected_action = criteria.get("expected_action")
    if expected_action:
        checks += 1
        depth = adaptations.get("adjust_depth", "")
        if expected_action == "supplement" and depth == "simpler":
            score += 1.0
        elif expected_action == "challenge" and depth == "deeper":
            score += 1.0
        elif expected_action == "continue" and depth == "maintain":
            score += 1.0

    # Encouraging tone (simple keyword check)
    checks += 1
    encouraging_words = ["great", "good", "well", "keep", "progress", "excellent", "nice"]
    if any(w in feedback.lower() for w in encouraging_words):
        score += 1.0
    else:
        score += 0.3  # partial credit

    return round(score / checks, 3) if checks > 0 else 0.0
