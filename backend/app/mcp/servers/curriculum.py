"""MCP Curriculum Resource Server.

Exposes course data and progress as MCP resources and tools.
Uses the mcp SDK to define a server that agents can connect to.
"""

from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

# In-memory store shared with the course service
_course_store: dict[str, dict[str, Any]] = {}
_progress_store: dict[str, dict[str, Any]] = {}

mcp_server = FastMCP("curriculum")


# ---------------------------------------------------------------------------
# Resources
# ---------------------------------------------------------------------------


@mcp_server.resource("curriculum://courses/{course_id}")
def get_course_resource(course_id: str) -> str:
    """Return full course data as JSON string."""
    course = _course_store.get(course_id)
    if course is None:
        return '{"error": "Course not found"}'
    import json
    return json.dumps(course, default=str)


@mcp_server.resource("curriculum://courses/{course_id}/progress")
def get_progress_resource(course_id: str) -> str:
    """Return progress data for a course."""
    progress = _progress_store.get(course_id, {
        "completed_lessons": [],
        "quiz_scores": {},
        "total_time_minutes": 0,
    })
    import json
    return json.dumps(progress, default=str)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@mcp_server.tool()
def update_lesson_status(
    course_id: str, lesson_index: int, completed: bool
) -> dict[str, Any]:
    """Mark a lesson as completed or not."""
    progress = _progress_store.setdefault(course_id, {
        "completed_lessons": [],
        "quiz_scores": {},
        "total_time_minutes": 0,
    })

    completed_set = set(progress["completed_lessons"])
    if completed:
        completed_set.add(lesson_index)
    else:
        completed_set.discard(lesson_index)
    progress["completed_lessons"] = sorted(completed_set)

    return {"success": True, "completed_lessons": progress["completed_lessons"]}


@mcp_server.tool()
def record_quiz_score(
    course_id: str, quiz_index: int, score: float
) -> dict[str, Any]:
    """Store a quiz score."""
    progress = _progress_store.setdefault(course_id, {
        "completed_lessons": [],
        "quiz_scores": {},
        "total_time_minutes": 0,
    })
    progress["quiz_scores"][str(quiz_index)] = score
    return {"success": True, "quiz_scores": progress["quiz_scores"]}


@mcp_server.tool()
def get_student_profile(course_id: str) -> dict[str, Any]:
    """Retrieve aggregated learner data for the tutor agent."""
    progress = _progress_store.get(course_id, {})
    scores = list(progress.get("quiz_scores", {}).values())
    return {
        "completed_lessons": len(progress.get("completed_lessons", [])),
        "quiz_scores": scores,
        "average_score": sum(scores) / len(scores) if scores else 0.0,
        "total_time_minutes": progress.get("total_time_minutes", 0),
    }


# ---------------------------------------------------------------------------
# Store management (called by the service layer)
# ---------------------------------------------------------------------------


def sync_course_to_mcp(course_id: str, course_data: dict[str, Any]) -> None:
    """Push course data into the MCP store so resources stay current."""
    _course_store[course_id] = course_data


def get_mcp_progress(course_id: str) -> dict[str, Any]:
    """Read progress from the MCP store."""
    return _progress_store.get(course_id, {})
