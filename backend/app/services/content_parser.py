"""Content parser — splits lesson markdown + interactive elements into structured blocks.

Converts raw lesson content containing [Interactive Check N] markers and a
parallel list of interactive_elements into a list of typed content blocks
that the frontend can render directly without regex splitting.

Also provides SSE event validation and structured logging.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

LOGS_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Content block models
# ---------------------------------------------------------------------------

MARKER_RE = re.compile(r"\[Interactive Check (\d+)\]")


class MarkdownBlock(BaseModel):
    type: Literal["markdown"] = "markdown"
    content: str


class InteractiveBlock(BaseModel):
    type: Literal["interactive"] = "interactive"
    index: int
    schema_: dict[str, Any] = Field(alias="schema", default_factory=dict)

    model_config = {"populate_by_name": True}


ContentBlock = MarkdownBlock | InteractiveBlock


def parse_lesson_content(
    content: str,
    interactive_elements: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Split lesson markdown at [Interactive Check N] markers.

    Returns a list of content block dicts:
        [
            {"type": "markdown", "content": "..."},
            {"type": "interactive", "index": 0, "schema": {...}},
            {"type": "markdown", "content": "..."},
            ...
        ]

    Any interactive elements not referenced by a marker are appended at the end.
    """
    if not interactive_elements:
        return [{"type": "markdown", "content": content}] if content.strip() else []

    parts = MARKER_RE.split(content)
    # parts alternates: [text, index_str, text, index_str, ...]
    blocks: list[dict[str, Any]] = []
    referenced: set[int] = set()

    for i, part in enumerate(parts):
        if i % 2 == 0:
            # Markdown segment
            if part.strip():
                blocks.append({"type": "markdown", "content": part})
        else:
            # Interactive check index
            idx = int(part)
            referenced.add(idx)
            if 0 <= idx < len(interactive_elements):
                blocks.append({
                    "type": "interactive",
                    "index": idx,
                    "schema": interactive_elements[idx],
                })
            else:
                logger.warning(
                    "Interactive check index %d out of range (have %d elements)",
                    idx, len(interactive_elements),
                )

    # Append any unreferenced interactive elements at the end
    for idx, schema in enumerate(interactive_elements):
        if idx not in referenced:
            blocks.append({
                "type": "interactive",
                "index": idx,
                "schema": schema,
            })

    return blocks


# ---------------------------------------------------------------------------
# SSE event parser / validator
# ---------------------------------------------------------------------------

VALID_SSE_TYPES = frozenset({
    "planning",
    "outline_ready",
    "awaiting_confirmation",
    "generating_lesson",
    "lesson_ready",
    "generating_quiz",
    "quiz_ready",
    "tutor_feedback",
    "complete",
    "error",
})


class SSELogger:
    """Validates and logs SSE events to a JSONL file for a single course generation."""

    def __init__(self, course_id: str) -> None:
        self.course_id = course_id
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        self.log_path = LOGS_DIR / f"{course_id[:8]}_sse_{ts}.jsonl"
        self._file = open(self.log_path, "a")  # noqa: SIM115
        self.event_count = 0
        self.errors: list[str] = []

    def log(self, event_type: str, payload: str) -> list[str]:
        """Validate and log a single SSE event. Returns list of validation warnings."""
        warnings: list[str] = []
        self.event_count += 1

        if event_type not in VALID_SSE_TYPES:
            warnings.append(f"Unknown SSE event type: {event_type}")

        try:
            data = json.loads(payload)
        except json.JSONDecodeError as e:
            warnings.append(f"Invalid JSON payload: {e}")
            data = {"_raw": payload[:500]}

        if not isinstance(data, dict):
            warnings.append(f"Payload is not a dict: {type(data).__name__}")

        if "message" not in (data if isinstance(data, dict) else {}):
            warnings.append("Payload missing 'message' field")

        # Write structured log entry
        entry = {
            "seq": self.event_count,
            "ts": datetime.now(timezone.utc).isoformat(),
            "event": event_type,
            "data": data,
        }
        if warnings:
            entry["warnings"] = warnings
            self.errors.extend(warnings)

        self._file.write(json.dumps(entry, default=str) + "\n")
        self._file.flush()

        if warnings:
            logger.warning(
                "SSE [%s] #%d event=%s warnings=%s",
                self.course_id[:8], self.event_count, event_type, warnings,
            )
        else:
            logger.info(
                "SSE [%s] #%d event=%s msg=%s",
                self.course_id[:8], self.event_count, event_type,
                (data.get("message", "")[:100] if isinstance(data, dict) else ""),
            )

        return warnings

    def close(self) -> dict[str, Any]:
        """Close the log file and return a summary."""
        self._file.close()
        summary = {
            "course_id": self.course_id,
            "log_path": str(self.log_path),
            "total_events": self.event_count,
            "total_warnings": len(self.errors),
            "warnings": self.errors[:20],  # cap for readability
        }
        if self.errors:
            logger.warning("SSE stream for %s had %d warnings", self.course_id[:8], len(self.errors))
        return summary
