"""Integration tests for MCP servers and client."""

from __future__ import annotations

from app.mcp.servers.curriculum import (
    get_student_profile,
    record_quiz_score,
    update_lesson_status,
    sync_course_to_mcp,
    get_mcp_progress,
    _progress_store,
    _course_store,
)
from app.mcp.servers.research import (
    search_web,
    fetch_documentation,
    summarize_source,
    cache_research,
    get_cached_research,
    _research_cache,
)
from app.mcp.client import MCPClientManager


class TestCurriculumMCPServer:
    def setup_method(self) -> None:
        _progress_store.clear()
        _course_store.clear()

    def test_update_lesson_status_complete(self) -> None:
        result = update_lesson_status("test-1", 0, True)
        assert result["success"] is True
        assert 0 in result["completed_lessons"]

    def test_update_lesson_status_uncomplete(self) -> None:
        update_lesson_status("test-1", 0, True)
        result = update_lesson_status("test-1", 0, False)
        assert 0 not in result["completed_lessons"]

    def test_record_quiz_score(self) -> None:
        result = record_quiz_score("test-1", 0, 0.85)
        assert result["success"] is True
        assert result["quiz_scores"]["0"] == 0.85

    def test_get_student_profile_empty(self) -> None:
        result = get_student_profile("nonexistent")
        assert result["completed_lessons"] == 0
        assert result["average_score"] == 0.0

    def test_get_student_profile_with_data(self) -> None:
        update_lesson_status("test-2", 0, True)
        update_lesson_status("test-2", 1, True)
        record_quiz_score("test-2", 0, 0.9)
        record_quiz_score("test-2", 1, 0.7)
        result = get_student_profile("test-2")
        assert result["completed_lessons"] == 2
        assert result["average_score"] == 0.8

    def test_sync_course_to_mcp(self) -> None:
        sync_course_to_mcp("c1", {"id": "c1", "title": "Test"})
        assert "c1" in _course_store


class TestResearchMCPServer:
    def setup_method(self) -> None:
        _research_cache.clear()

    def test_search_web(self) -> None:
        results = search_web("Python decorators", 3)
        assert len(results) == 3
        assert all("title" in r for r in results)

    def test_fetch_documentation(self) -> None:
        result = fetch_documentation("https://docs.python.org")
        assert "docs.python.org" in result

    def test_summarize_source_short(self) -> None:
        result = summarize_source("Short text", 500)
        assert result == "Short text"

    def test_summarize_source_long(self) -> None:
        long_text = "x" * 1000
        result = summarize_source(long_text, 100)
        assert len(result) < 1000
        assert "truncated" in result

    def test_cache_and_retrieve(self) -> None:
        cache_research("python", {"summary": "Python is great"})
        result = get_cached_research("python")
        assert result is not None
        assert result["summary"] == "Python is great"

    def test_cache_case_insensitive(self) -> None:
        cache_research("Python", {"summary": "Python info"})
        result = get_cached_research("python")
        assert result is not None


class TestMCPClientManager:
    def test_get_curriculum_tools(self) -> None:
        client = MCPClientManager()
        tools = client.get_curriculum_tools()
        assert len(tools) == 3
        names = {t.name for t in tools}
        assert "mcp_update_lesson_status" in names
        assert "mcp_record_quiz_score" in names
        assert "mcp_get_student_profile" in names

    def test_get_research_tools(self) -> None:
        client = MCPClientManager()
        tools = client.get_research_tools()
        assert len(tools) == 3
        names = {t.name for t in tools}
        assert "mcp_search_web" in names
        assert "mcp_fetch_documentation" in names
        assert "mcp_summarize_source" in names

    def test_get_all_tools(self) -> None:
        client = MCPClientManager()
        tools = client.get_all_tools()
        assert len(tools) == 6
