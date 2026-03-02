"""Lesson Writer — LangGraph state machine.

Nodes:  research → draft → add_interactive → review →(revise|finalize)
"""

from __future__ import annotations

from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.agents.llm import get_llm
from app.agents.prompts.output_schemas import InteractiveElementOutput, ValidationOutput
from app.agents.prompts.system_prompts import (
    INTERACTIVE_ELEMENT_SYSTEM,
    LESSON_WRITER_SYSTEM,
    VALIDATION_SYSTEM,
)
from app.agents.tools.content_tools import get_content_tools
from app.models.agent import LessonWriterState
from app.models.course import Lesson

# ---------------------------------------------------------------------------
# Node implementations
# ---------------------------------------------------------------------------


def research_node(state: LessonWriterState) -> dict[str, Any]:
    """Gather material for the lesson using content tools."""
    outline = state["outline"]
    prefs = state["course_preferences"]
    tools = get_content_tools()

    # Generate a code example for the first key topic
    code_example = tools[0].invoke(
        {
            "topic": prefs.topic,
            "language": "python",
            "concept": outline.key_topics[0] if outline.key_topics else prefs.topic,
        }
    )

    research_msg = HumanMessage(
        content=(
            f"Research for lesson '{outline.title}':\n"
            f"Key topics: {', '.join(outline.key_topics)}\n\n"
            f"Code example:\n{code_example}"
        )
    )
    return {"messages": [research_msg]}


def draft_content_node(state: LessonWriterState) -> dict[str, Any]:
    """Draft the full lesson in Markdown using the LLM."""
    outline = state["outline"]
    prefs = state["course_preferences"]
    previous_titles = state.get("previous_lesson_titles", [])

    llm = get_llm(purpose="writing")
    interactive_count = 2

    system_prompt = LESSON_WRITER_SYSTEM.format(
        topic=prefs.topic,
        title=outline.title,
        key_topics=", ".join(outline.key_topics),
        level=prefs.level,
        learning_style=prefs.learning_style,
        previous_titles=", ".join(previous_titles) if previous_titles else "None (first lesson)",
        interactive_count=interactive_count,
        estimated_minutes=outline.estimated_minutes,
    )

    context = "\n".join(
        m.content for m in state.get("messages", []) if hasattr(m, "content") and isinstance(m.content, str)
    )

    try:
        response = llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Write the lesson.\n\nResearch context:\n{context}"),
            ]
        )
        content = response.content if isinstance(response.content, str) else str(response.content)
    except Exception:
        content = _fallback_lesson_content(outline, prefs)

    return {"draft_content": content}


def add_interactive_node(state: LessonWriterState) -> dict[str, Any]:
    """Replace {{CHECK:n}} markers with DynamicUI schemas."""
    content = state.get("draft_content", "")
    tools = get_content_tools()
    interactive_elements: list[dict[str, Any]] = []

    check_types = ["recall", "reflection", "exploration"]

    for i in range(1, 4):
        marker = f"{{{{CHECK:{i}}}}}"
        if marker in content:
            check_type = check_types[(i - 1) % len(check_types)]
            schema = tools[2].invoke({"context": content[:200], "check_type": check_type})
            interactive_elements.append(schema)
            content = content.replace(marker, f"[Interactive Check {i}]", 1)

    # If no markers found, add default interactive elements
    if not interactive_elements:
        for check_type in ["recall", "reflection"]:
            schema = tools[2].invoke({"context": content[:200], "check_type": check_type})
            interactive_elements.append(schema)

    return {
        "draft_content": content,
        "interactive_elements": interactive_elements,
    }


def review_node(state: LessonWriterState) -> dict[str, Any]:
    """Self-review the draft for quality."""
    content = state.get("draft_content", "")
    prefs = state["course_preferences"]

    issues: list[str] = []

    # Structural checks
    if len(content) < 100:
        issues.append("Lesson content is too short (< 100 chars).")
    if "# " not in content and "## " not in content:
        issues.append("Lesson lacks Markdown headings.")
    if not state.get("interactive_elements"):
        issues.append("No interactive elements generated.")

    valid = len(issues) == 0
    return {
        "validation_result": {"valid": valid, "issues": issues, "suggestions": []},
    }


def revise_node(state: LessonWriterState) -> dict[str, Any]:
    """Attempt to fix review issues."""
    content = state.get("draft_content", "")
    outline = state["outline"]
    issues = (state.get("validation_result") or {}).get("issues", [])

    # If content is too short, expand it
    if any("too short" in issue for issue in issues):
        content = _fallback_lesson_content(outline, state["course_preferences"])

    # If missing headings, add them
    if any("headings" in issue for issue in issues) and "## " not in content:
        content = f"## {outline.title}\n\n{content}"

    return {
        "draft_content": content,
        "retry_count": state.get("retry_count", 0) + 1,
    }


def finalize_node(state: LessonWriterState) -> dict[str, Any]:
    """Assemble the final Lesson object."""
    outline = state["outline"]
    lesson = Lesson(
        index=outline.index,
        title=outline.title,
        summary=outline.summary,
        key_topics=outline.key_topics,
        has_quiz=outline.has_quiz,
        estimated_minutes=outline.estimated_minutes,
        content=state.get("draft_content", ""),
        interactive_elements=state.get("interactive_elements", []),
        is_completed=False,
        is_unlocked=False,
    )
    return {"lesson": lesson}


# ---------------------------------------------------------------------------
# Conditional edge
# ---------------------------------------------------------------------------


def should_revise(state: LessonWriterState) -> str:
    vr = state.get("validation_result") or {}
    if vr.get("valid", False) or state.get("retry_count", 0) >= 1:
        return "accept"
    return "revise"


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------


def build_lesson_writer_graph() -> StateGraph:
    """Build and return the (uncompiled) lesson writer state graph."""
    graph = StateGraph(LessonWriterState)

    graph.add_node("research", research_node)
    graph.add_node("draft", draft_content_node)
    graph.add_node("add_interactive", add_interactive_node)
    graph.add_node("review", review_node)
    graph.add_node("revise", revise_node)
    graph.add_node("finalize", finalize_node)

    graph.add_edge(START, "research")
    graph.add_edge("research", "draft")
    graph.add_edge("draft", "add_interactive")
    graph.add_edge("add_interactive", "review")
    graph.add_conditional_edges(
        "review",
        should_revise,
        {"revise": "revise", "accept": "finalize"},
    )
    graph.add_edge("revise", "review")
    graph.add_edge("finalize", END)

    return graph


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _fallback_lesson_content(outline, prefs) -> str:
    """Deterministic fallback content when LLM is unavailable."""
    topics_md = "\n".join(f"- {t}" for t in outline.key_topics)
    return (
        f"## {outline.title}\n\n"
        f"{outline.summary}\n\n"
        f"### Key Topics\n\n{topics_md}\n\n"
        f"### Introduction\n\n"
        f"In this lesson we explore {outline.title.lower()} as part of our "
        f"{prefs.level} course on {prefs.topic}. "
        f"We will cover the fundamentals and work through practical examples.\n\n"
        f"### Core Concepts\n\n"
        f"Each of the key topics above builds on the previous one, "
        f"giving you a solid foundation in {prefs.topic}.\n\n"
        f"### Summary\n\n"
        f"You have completed {outline.title}. "
        f"Review the key topics above before moving to the next lesson.\n"
    )
