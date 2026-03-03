"""Quiz Generator — LangGraph state machine.

Nodes: analyze_lesson → generate_questions → validate_answers →(fix|calibrate) → finalize
"""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.agents.llm import get_llm
from app.agents.prompts.output_schemas import QuizOutput
from app.agents.prompts.system_prompts import QUIZ_GENERATOR_SYSTEM
from app.agents.tools.assessment_tools import get_assessment_tools
from app.models.agent import QuizGeneratorState
from app.models.course import Quiz, QuizOption, QuizQuestion

# ---------------------------------------------------------------------------
# Node implementations
# ---------------------------------------------------------------------------


def analyze_lesson_node(state: QuizGeneratorState) -> dict[str, Any]:
    """Extract key concepts from the lesson for quiz targeting."""
    lesson = state["lesson"]
    key_concepts = list(lesson.key_topics)

    # Add concepts extracted from content keywords
    content_lower = lesson.content.lower()
    for keyword in ["important", "key", "note", "remember"]:
        if keyword in content_lower:
            idx = content_lower.index(keyword)
            snippet = lesson.content[idx : idx + 80].strip()
            if snippet not in key_concepts:
                key_concepts.append(snippet[:60])

    return {"key_concepts": key_concepts[:8]}


def generate_questions_node(state: QuizGeneratorState) -> dict[str, Any]:
    """Generate quiz questions using the LLM."""
    lesson = state["lesson"]
    prefs = state["course_preferences"]
    key_concepts = state.get("key_concepts", lesson.key_topics)

    llm = get_llm(purpose="assessment")
    question_count = min(4 + len(key_concepts) // 2, 6)

    objectives_str = "\n".join(
        f"  - [{o.get('blooms_level', 'Apply')}] {o.get('objective', '')}"
        for o in lesson.learning_objectives
    ) or "  - [Apply] Understand the key concepts"

    system_prompt = QUIZ_GENERATOR_SYSTEM.format(
        title=lesson.title,
        lesson_summary=lesson.summary,
        key_concepts=", ".join(key_concepts),
        key_terms=", ".join(lesson.key_terms) if lesson.key_terms else ", ".join(lesson.key_topics[:3]),
        learning_objectives=objectives_str,
        level=prefs.level,
        question_count=question_count,
    )

    try:
        structured_llm = llm.with_structured_output(QuizOutput)
        result: QuizOutput = structured_llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(
                    content=f"Generate {question_count} quiz questions for the lesson "
                    f"'{lesson.title}' covering: {', '.join(key_concepts)}"
                ),
            ]
        )
        questions = [q.model_dump() for q in result.questions]
    except Exception:
        questions = _fallback_questions(lesson, key_concepts, question_count)

    return {"questions": questions}


def validate_answers_node(state: QuizGeneratorState) -> dict[str, Any]:
    """Validate that each question's correct_answer is sensible."""
    questions = state.get("questions", [])
    issues: list[str] = []

    for q in questions:
        if not q.get("correct_answer"):
            issues.append(f"Question '{q.get('id', '?')}' has no correct_answer.")
        if q.get("question_type") == "multiple-choice":
            options = q.get("options") or []
            opt_values = [o.get("value", o) if isinstance(o, dict) else str(o) for o in options]
            if q.get("correct_answer") not in opt_values:
                issues.append(
                    f"Question '{q.get('id', '?')}': correct_answer "
                    f"'{q.get('correct_answer')}' not in options."
                )

    valid = len(issues) == 0
    return {"validation_result": {"valid": valid, "issues": issues}}


def calibrate_difficulty_node(state: QuizGeneratorState) -> dict[str, Any]:
    """Reorder questions from easier to harder using the difficulty tool."""
    questions = state.get("questions", [])
    tools = get_assessment_tools()
    difficulty_tool = tools[2]

    scored: list[tuple[int, dict]] = []
    for q in questions:
        opts = q.get("options") or []
        opt_labels = [
            o.get("label", o) if isinstance(o, dict) else str(o) for o in opts
        ]
        score = difficulty_tool.invoke(
            {"question": q.get("question", ""), "options": opt_labels}
        )
        scored.append((score, q))

    scored.sort(key=lambda x: x[0])
    return {"questions": [q for _, q in scored]}


def finalize_node(state: QuizGeneratorState) -> dict[str, Any]:
    """Assemble the Quiz pydantic model."""
    lesson = state["lesson"]
    questions_raw = state.get("questions", [])

    quiz_questions: list[QuizQuestion] = []
    for q in questions_raw:
        options = None
        raw_opts = q.get("options")
        if raw_opts:
            options = [
                QuizOption(
                    value=o["value"] if isinstance(o, dict) else str(o),
                    label=o.get("label", o["value"]) if isinstance(o, dict) else str(o),
                )
                for o in raw_opts
            ]
        quiz_questions.append(
            QuizQuestion(
                id=q.get("id", str(uuid4())[:8]),
                question=q.get("question", ""),
                question_type=q.get("question_type", "multiple-choice"),
                options=options,
                correct_answer=q.get("correct_answer", ""),
                explanation=q.get("explanation", "Review the lesson content."),
            )
        )

    quiz = Quiz(lesson_index=lesson.index, questions=quiz_questions)
    return {"quiz": quiz}


# ---------------------------------------------------------------------------
# Conditional edge
# ---------------------------------------------------------------------------


def answers_valid(state: QuizGeneratorState) -> str:
    vr = state.get("validation_result") or {}
    if vr.get("valid", False) or state.get("retry_count", 0) >= 1:
        return "ok"
    return "fix"


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------


def build_quiz_generator_graph() -> StateGraph:
    """Build and return the (uncompiled) quiz generator state graph."""
    graph = StateGraph(QuizGeneratorState)

    graph.add_node("analyze_lesson", analyze_lesson_node)
    graph.add_node("generate_questions", generate_questions_node)
    graph.add_node("validate_answers", validate_answers_node)
    graph.add_node("calibrate", calibrate_difficulty_node)
    graph.add_node("finalize", finalize_node)

    graph.add_edge(START, "analyze_lesson")
    graph.add_edge("analyze_lesson", "generate_questions")
    graph.add_edge("generate_questions", "validate_answers")
    graph.add_conditional_edges(
        "validate_answers",
        answers_valid,
        {"fix": "generate_questions", "ok": "calibrate"},
    )
    graph.add_edge("calibrate", "finalize")
    graph.add_edge("finalize", END)

    return graph


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _fallback_questions(
    lesson, key_concepts: list[str], count: int
) -> list[dict[str, Any]]:
    """Deterministic fallback questions when LLM is unavailable."""
    questions: list[dict[str, Any]] = []
    q_types = ["multiple-choice", "true-false", "short-answer"]

    for i in range(count):
        concept = key_concepts[i % len(key_concepts)] if key_concepts else lesson.title
        q_type = q_types[i % len(q_types)]
        q: dict[str, Any] = {
            "id": f"q-{lesson.index}-{i}",
            "question_type": q_type,
            "correct_answer": "a" if q_type == "multiple-choice" else "true" if q_type == "true-false" else concept,
            "explanation": f"Review the section on {concept} in the lesson.",
        }
        if q_type == "multiple-choice":
            q["question"] = f"Which of the following best describes {concept}?"
            q["options"] = [
                {"value": "a", "label": f"Correct description of {concept}"},
                {"value": "b", "label": f"Common misconception about {concept}"},
                {"value": "c", "label": "An unrelated concept"},
            ]
        elif q_type == "true-false":
            q["question"] = f"{concept} is a core concept in {lesson.title}."
            q["options"] = [
                {"value": "true", "label": "True"},
                {"value": "false", "label": "False"},
            ]
        else:
            q["question"] = f"Briefly explain {concept}."
            q["options"] = None
        questions.append(q)
    return questions
