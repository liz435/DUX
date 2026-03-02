"""MCP Content Research Server.

Exposes research data and tools for agents to use during content generation.
"""

from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

# Cache for research results
_research_cache: dict[str, dict[str, Any]] = {}

mcp_server = FastMCP("research")


# ---------------------------------------------------------------------------
# Resources
# ---------------------------------------------------------------------------


@mcp_server.resource("research://topics/{topic}")
def get_topic_research(topic: str) -> str:
    """Return cached research results for a topic."""
    import json

    cached = _research_cache.get(topic.lower())
    if cached:
        return json.dumps(cached, default=str)

    # Return a stub if not cached
    return json.dumps({
        "topic": topic,
        "summary": f"Research data for '{topic}' — not yet cached.",
        "key_concepts": [],
        "references": [],
    })


@mcp_server.resource("research://references")
def get_references() -> str:
    """Return curated reference materials."""
    import json

    return json.dumps({
        "references": [
            {"source": "documentation", "description": "Official documentation"},
            {"source": "tutorials", "description": "Community tutorials"},
            {"source": "papers", "description": "Research papers"},
        ]
    })


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@mcp_server.tool()
def search_web(query: str, max_results: int = 5) -> list[dict[str, str]]:
    """Search the web for information. Returns a list of result dicts.

    In production, this wraps an external search API (e.g. Tavily, SerpAPI).
    """
    # Placeholder — returns a structured stub.
    return [
        {
            "title": f"Result {i + 1} for '{query}'",
            "url": f"https://example.com/search?q={query}&p={i}",
            "snippet": f"Relevant information about {query} (result {i + 1}).",
        }
        for i in range(min(max_results, 5))
    ]


@mcp_server.tool()
def fetch_documentation(url: str) -> str:
    """Fetch and return content from a documentation URL.

    In production, this performs an HTTP fetch and extracts text.
    """
    return f"Documentation content from {url} (placeholder)."


@mcp_server.tool()
def summarize_source(content: str, max_tokens: int = 500) -> str:
    """Compress a long reference source into a shorter summary.

    In production, this uses an LLM to summarize.
    """
    if len(content) <= max_tokens:
        return content
    return content[:max_tokens] + "... [truncated]"


# ---------------------------------------------------------------------------
# Cache management
# ---------------------------------------------------------------------------


def cache_research(topic: str, data: dict[str, Any]) -> None:
    """Store research results in the cache."""
    _research_cache[topic.lower()] = data


def get_cached_research(topic: str) -> dict[str, Any] | None:
    """Retrieve cached research results."""
    return _research_cache.get(topic.lower())
