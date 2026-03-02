"""Course Planner — LangGraph state machine.

Nodes:  analyze_topic → generate_outline → validate_outline →(refine|finalize)
"""

from __future__ import annotations

import json
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.agents.llm import get_llm
from app.agents.prompts.output_schemas import OutlineOutput, ValidationOutput
from app.agents.prompts.system_prompts import COURSE_PLANNER_SYSTEM, VALIDATION_SYSTEM
from app.agents.tools.curriculum_tools import get_curriculum_tools
from app.models.agent import AgentState
from app.models.course import CoursePreferences, LessonOutline

# ---------------------------------------------------------------------------
# Node implementations
# ---------------------------------------------------------------------------


def analyze_topic_node(state: AgentState) -> dict[str, Any]:
    """Use curriculum tools to research the topic and build context."""
    prefs: CoursePreferences = state["course_preferences"]
    tools = get_curriculum_tools()

    # Call tools directly for deterministic research
    topic_info = tools[0].invoke({"query": prefs.topic})
    objectives = tools[1].invoke({"topic": prefs.topic, "level": prefs.level})

    context_msg = HumanMessage(
        content=(
            f"Topic research:\n{topic_info}\n\n"
            f"Learning objectives:\n" + "\n".join(f"- {o}" for o in objectives)
        )
    )
    return {
        "messages": [context_msg],
        "current_step": "analyze_topic",
    }


def generate_outline_node(state: AgentState) -> dict[str, Any]:
    """Generate the course outline using the LLM with structured output."""
    prefs: CoursePreferences = state["course_preferences"]
    llm = get_llm(purpose="planning")

    system_prompt = COURSE_PLANNER_SYSTEM.format(
        lesson_count=prefs.lesson_count,
        level=prefs.level,
        learning_style=prefs.learning_style,
    )

    # Gather context from prior messages
    context = "\n".join(
        m.content for m in state.get("messages", []) if hasattr(m, "content") and isinstance(m.content, str)
    )

    try:
        structured_llm = llm.with_structured_output(OutlineOutput)
        result: OutlineOutput = structured_llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(
                    content=f"Create a {prefs.course_length} course on '{prefs.topic}' "
                    f"for a {prefs.level} learner.\n\nContext:\n{context}"
                ),
            ]
        )
        outlines = [
            LessonOutline(
                index=item.index,
                title=item.title,
                summary=item.summary,
                key_topics=item.key_topics,
                has_quiz=item.has_quiz,
                estimated_minutes=item.estimated_minutes,
            )
            for item in result.lessons
        ]
    except Exception:
        # Fallback: generate a deterministic outline
        outlines = _fallback_outline(prefs)

    return {
        "outline": outlines,
        "current_step": "generate_outline",
    }


def validate_outline_node(state: AgentState) -> dict[str, Any]:
    """Validate the outline for quality: progression, coverage, count."""
    prefs: CoursePreferences = state["course_preferences"]
    outlines = state.get("outline", [])

    issues: list[str] = []

    # Structural checks (deterministic)
    if len(outlines) != prefs.lesson_count:
        issues.append(
            f"Expected {prefs.lesson_count} lessons, got {len(outlines)}."
        )

    indices = [o.index for o in outlines]
    if indices != list(range(len(outlines))):
        issues.append("Lesson indices are not sequential from 0.")

    titles = [o.title for o in outlines]
    if len(set(titles)) != len(titles):
        issues.append("Duplicate lesson titles found.")

    for o in outlines:
        if len(o.key_topics) < 2:
            issues.append(f"Lesson {o.index} has fewer than 2 key topics.")

    valid = len(issues) == 0
    return {
        "validation_result": {"valid": valid, "issues": issues, "suggestions": []},
        "current_step": "validate_outline",
    }


def refine_outline_node(state: AgentState) -> dict[str, Any]:
    """Attempt to fix validation issues in the outline."""
    prefs: CoursePreferences = state["course_preferences"]
    outlines = state.get("outline", [])
    issues = state.get("validation_result", {}).get("issues", [])

    # Fix count mismatch
    while len(outlines) < prefs.lesson_count:
        idx = len(outlines)
        outlines.append(
            LessonOutline(
                index=idx,
                title=f"{prefs.topic} — Part {idx + 1}",
                summary=f"Continuation of {prefs.topic}.",
                key_topics=[f"topic-{idx}-a", f"topic-{idx}-b", f"topic-{idx}-c"],
                has_quiz=(idx % 2 == 1),
                estimated_minutes=15,
            )
        )
    outlines = outlines[: prefs.lesson_count]

    # Fix indices
    for i, o in enumerate(outlines):
        if o.index != i:
            outlines[i] = o.model_copy(update={"index": i})

    return {
        "outline": outlines,
        "retry_count": state.get("retry_count", 0) + 1,
        "current_step": "refine_outline",
    }


def finalize_node(state: AgentState) -> dict[str, Any]:
    """Mark the outline as finalized."""
    return {"current_step": "finalized"}


# ---------------------------------------------------------------------------
# Conditional edge
# ---------------------------------------------------------------------------


def should_refine(state: AgentState) -> str:
    vr = state.get("validation_result") or {}
    if vr.get("valid", False) or state.get("retry_count", 0) >= 2:
        return "accept"
    return "refine"


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------


def build_course_planner_graph() -> StateGraph:
    """Build and return the (uncompiled) course planner state graph."""
    graph = StateGraph(AgentState)

    graph.add_node("analyze_topic", analyze_topic_node)
    graph.add_node("generate_outline", generate_outline_node)
    graph.add_node("validate_outline", validate_outline_node)
    graph.add_node("refine_outline", refine_outline_node)
    graph.add_node("finalize", finalize_node)

    graph.add_edge(START, "analyze_topic")
    graph.add_edge("analyze_topic", "generate_outline")
    graph.add_edge("generate_outline", "validate_outline")
    graph.add_conditional_edges(
        "validate_outline",
        should_refine,
        {"refine": "refine_outline", "accept": "finalize"},
    )
    graph.add_edge("refine_outline", "validate_outline")
    graph.add_edge("finalize", END)

    return graph


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _fallback_outline(prefs: CoursePreferences) -> list[LessonOutline]:
    """Generate a deterministic fallback outline when LLM fails."""
    return [
        LessonOutline(
            index=i,
            title=f"{prefs.topic} — Part {i + 1}",
            summary=f"{'Introduction to' if i == 0 else 'Continuing'} {prefs.topic}.",
            key_topics=[
                f"{prefs.topic} concept {i * 3 + j + 1}" for j in range(3)
            ],
            has_quiz=(i % 2 == 1),
            estimated_minutes=15,
        )
        for i in range(prefs.lesson_count)
    ]
