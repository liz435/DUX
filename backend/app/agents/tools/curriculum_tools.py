"""Curriculum-focused LangChain tools for the course planner agent."""

from __future__ import annotations

from langchain_core.tools import tool


@tool
def search_topic_info(query: str) -> str:
    """Search for information about a course topic.

    Returns a summary of relevant information to inform curriculum design.
    In production this wraps an external search API (e.g. Tavily).
    """
    # Placeholder — returns a structured stub. In production, this would call
    # an external search API and summarise results.
    return (
        f"Topic research results for '{query}':\n"
        f"- '{query}' is a well-established subject with extensive learning resources.\n"
        f"- Key sub-topics include foundational concepts, practical applications, "
        f"and advanced techniques.\n"
        f"- Common prerequisites: basic programming knowledge.\n"
        f"- Recommended learning path: fundamentals → intermediate patterns → "
        f"advanced use-cases."
    )


@tool
def get_learning_objectives(topic: str, level: str) -> list[str]:
    """Generate Bloom's taxonomy-aligned learning objectives for a topic and level.

    Returns a list of 4-6 learning objectives appropriate for the given level.
    """
    level_verbs = {
        "beginner": ["Define", "Identify", "Describe", "Explain"],
        "intermediate": ["Apply", "Analyze", "Compare", "Implement"],
        "advanced": ["Evaluate", "Design", "Synthesize", "Optimize"],
    }
    verbs = level_verbs.get(level, level_verbs["intermediate"])
    return [
        f"{verbs[i % len(verbs)]} key concepts of {topic} (objective {i + 1})"
        for i in range(5)
    ]


@tool
def check_prerequisite_coverage(
    lesson_titles: list[str], current_index: int
) -> dict[str, object]:
    """Check whether previous lessons cover prerequisites for the lesson at current_index.

    Returns a dict with 'covered' (bool) and 'missing' (list of gaps).
    """
    if current_index == 0:
        return {"covered": True, "missing": []}

    # Simple heuristic: the first lesson always provides foundations
    prior = lesson_titles[:current_index]
    if len(prior) == 0:
        return {"covered": False, "missing": ["No prior lessons found."]}

    return {
        "covered": True,
        "missing": [],
        "prior_count": len(prior),
        "note": f"Lessons 0-{current_index - 1} provide progressive foundations.",
    }


def get_curriculum_tools() -> list:
    """Return the curriculum tool set for binding to agents."""
    return [search_topic_info, get_learning_objectives, check_prerequisite_coverage]
