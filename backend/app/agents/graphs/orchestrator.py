"""Orchestrator — top-level LangGraph state machine composing sub-graphs.

Nodes: plan_course → generate_first_lesson → (generate_first_quiz | finalize)
"""

from __future__ import annotations

from typing import Any

from langgraph.graph import END, START, StateGraph

from app.agents.graphs.course_planner import build_course_planner_graph
from app.agents.graphs.lesson_writer import build_lesson_writer_graph
from app.agents.graphs.quiz_generator import build_quiz_generator_graph
from app.models.agent import AgentState
from app.models.course import CoursePreferences, Lesson

# ---------------------------------------------------------------------------
# Compile sub-graphs once at module level
# ---------------------------------------------------------------------------

_planner = build_course_planner_graph().compile()
_writer = build_lesson_writer_graph().compile()
_quiz_gen = build_quiz_generator_graph().compile()

# ---------------------------------------------------------------------------
# Node implementations
# ---------------------------------------------------------------------------


def plan_course_node(state: AgentState) -> dict[str, Any]:
    """Invoke the course planner sub-graph."""
    prefs: CoursePreferences = state["course_preferences"]
    result = _planner.invoke(
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
    return {
        "outline": result["outline"],
        "current_step": "outline_ready",
    }


def generate_first_lesson_node(state: AgentState) -> dict[str, Any]:
    """Invoke the lesson writer for lesson 0."""
    outlines = state.get("outline", [])
    prefs = state["course_preferences"]

    if not outlines:
        return {"lessons": [], "current_step": "no_outline"}

    first_outline = outlines[0]
    result = _writer.invoke(
        {
            "messages": [],
            "outline": first_outline,
            "course_preferences": prefs,
            "previous_lesson_titles": [],
            "draft_content": "",
            "interactive_elements": [],
            "validation_result": None,
            "retry_count": 0,
            "lesson": None,
        }
    )

    lesson: Lesson | None = result.get("lesson")
    if lesson:
        lesson = lesson.model_copy(update={"is_unlocked": True})
        return {"lessons": [lesson], "current_step": "first_lesson_ready"}

    return {"lessons": [], "current_step": "lesson_failed"}


def generate_first_quiz_node(state: AgentState) -> dict[str, Any]:
    """Invoke the quiz generator for the first lesson (if it has a quiz)."""
    lessons = state.get("lessons", [])
    outlines = state.get("outline", [])
    prefs = state["course_preferences"]

    if not lessons or not outlines:
        return {"quizzes": [], "current_step": "no_lessons"}

    first_outline = outlines[0]
    if not first_outline.has_quiz:
        return {"quizzes": [], "current_step": "no_quiz_needed"}

    first_lesson = lessons[0]
    result = _quiz_gen.invoke(
        {
            "messages": [],
            "lesson": first_lesson,
            "course_preferences": prefs,
            "key_concepts": first_lesson.key_topics,
            "questions": [],
            "validation_result": None,
            "retry_count": 0,
            "quiz": None,
        }
    )

    quiz = result.get("quiz")
    return {
        "quizzes": [quiz] if quiz else [],
        "current_step": "first_quiz_ready" if quiz else "quiz_failed",
    }


def finalize_course_node(state: AgentState) -> dict[str, Any]:
    """Mark the orchestration as complete."""
    return {"current_step": "complete"}


# ---------------------------------------------------------------------------
# Conditional edge
# ---------------------------------------------------------------------------


def first_lesson_has_quiz(state: AgentState) -> str:
    outlines = state.get("outline", [])
    if outlines and outlines[0].has_quiz:
        return "yes"
    return "no"


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------


def build_orchestrator_graph() -> StateGraph:
    """Build and return the (uncompiled) orchestrator state graph."""
    graph = StateGraph(AgentState)

    graph.add_node("plan_course", plan_course_node)
    graph.add_node("generate_first_lesson", generate_first_lesson_node)
    graph.add_node("generate_first_quiz", generate_first_quiz_node)
    graph.add_node("finalize", finalize_course_node)

    graph.add_edge(START, "plan_course")
    graph.add_edge("plan_course", "generate_first_lesson")
    graph.add_conditional_edges(
        "generate_first_lesson",
        first_lesson_has_quiz,
        {"yes": "generate_first_quiz", "no": "finalize"},
    )
    graph.add_edge("generate_first_quiz", "finalize")
    graph.add_edge("finalize", END)

    return graph
