"""MCP client wrapper — bridges MCP servers with LangChain agents.

Converts MCP tools into LangChain BaseTool instances so agents can call them
through the standard tool-calling interface.
"""

from __future__ import annotations

from typing import Any

from langchain_core.tools import StructuredTool

from app.mcp.servers.curriculum import mcp_server as curriculum_server
from app.mcp.servers.research import mcp_server as research_server


class MCPClientManager:
    """Manages MCP server connections and provides LangChain-compatible tools."""

    def __init__(self) -> None:
        self._curriculum_server = curriculum_server
        self._research_server = research_server

    def get_curriculum_tools(self) -> list[StructuredTool]:
        """Return curriculum MCP tools as LangChain StructuredTool instances."""
        tools: list[StructuredTool] = []

        # Import the tool functions directly
        from app.mcp.servers.curriculum import (
            get_student_profile,
            record_quiz_score,
            update_lesson_status,
        )

        tools.append(
            StructuredTool.from_function(
                func=update_lesson_status,
                name="mcp_update_lesson_status",
                description="Mark a lesson as completed or not via MCP curriculum server.",
            )
        )
        tools.append(
            StructuredTool.from_function(
                func=record_quiz_score,
                name="mcp_record_quiz_score",
                description="Record a quiz score via MCP curriculum server.",
            )
        )
        tools.append(
            StructuredTool.from_function(
                func=get_student_profile,
                name="mcp_get_student_profile",
                description="Retrieve student profile data via MCP curriculum server.",
            )
        )
        return tools

    def get_research_tools(self) -> list[StructuredTool]:
        """Return research MCP tools as LangChain StructuredTool instances."""
        tools: list[StructuredTool] = []

        from app.mcp.servers.research import (
            fetch_documentation,
            search_web,
            summarize_source,
        )

        tools.append(
            StructuredTool.from_function(
                func=search_web,
                name="mcp_search_web",
                description="Search the web for information via MCP research server.",
            )
        )
        tools.append(
            StructuredTool.from_function(
                func=fetch_documentation,
                name="mcp_fetch_documentation",
                description="Fetch documentation from a URL via MCP research server.",
            )
        )
        tools.append(
            StructuredTool.from_function(
                func=summarize_source,
                name="mcp_summarize_source",
                description="Summarize a long source text via MCP research server.",
            )
        )
        return tools

    def get_all_tools(self) -> list[StructuredTool]:
        """Return all MCP tools as LangChain tools."""
        return self.get_curriculum_tools() + self.get_research_tools()


# Singleton instance
mcp_client = MCPClientManager()
