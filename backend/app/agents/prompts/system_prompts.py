"""System prompts — all defined in prompts.md, parsed from Stage code blocks."""

from __future__ import annotations

import re
from pathlib import Path

_RAW = (Path(__file__).parent / "prompts.md").read_text(encoding="utf-8")

# Match "## Stage N — <Name>" headings
_STAGE_RE = re.compile(r"^## Stage \d+ — (.+)$", re.MULTILINE)
# Match fenced code blocks (no language tag)
_BLOCK_RE = re.compile(r"^```\n(.*?)^```", re.MULTILINE | re.DOTALL)


def _slug(name: str) -> str:
    return name.strip().lower().replace(" ", "_").replace("/", "_")


def _escape_braces(text: str) -> str:
    """Escape all literal { } so .format() won't choke on JSON examples.

    Step 1 — double every brace:  {topic} → {{topic}},  { → {{
    Step 2 — restore valid {identifier} placeholders back to single braces.
    """
    text = text.replace("{", "{{").replace("}", "}}")
    return re.sub(r"\{\{(\w+)\}\}", r"{\1}", text)


def _parse_stages(text: str) -> dict[str, str]:
    stages: dict[str, str] = {}
    markers = list(_STAGE_RE.finditer(text))
    for i, m in enumerate(markers):
        section_end = markers[i + 1].start() if i + 1 < len(markers) else len(text)
        section = text[m.end() : section_end]
        block = _BLOCK_RE.search(section)
        if block:
            stages[_slug(m.group(1))] = _escape_braces(block.group(1).strip())
    return stages


_STAGES = _parse_stages(_RAW)


def _get(slug: str) -> str:
    if slug not in _STAGES:
        raise KeyError(f"Stage '{slug}' not found in prompts.md. Available: {list(_STAGES)}")
    return _STAGES[slug]


# Stage 1
SYLLABUS_ARCHITECT_SYSTEM = _get("syllabus_architect")
# Stage 2
COURSE_PLANNER_SYSTEM = _get("course_planner")
# Stage 3
LESSON_WRITER_SYSTEM = _get("lesson_writer")
# Stage 4
QUIZ_GENERATOR_SYSTEM = _get("quiz_generator")
# Stage 5
INTERACTIVE_ELEMENT_SYSTEM = _get("interactive_element_generator")
# Stage 6
TUTOR_SYSTEM = _get("adaptive_tutor")

# Legacy — validation is now done deterministically in the graph nodes
VALIDATION_SYSTEM = (
    "You are a quality reviewer. Evaluate the content for accuracy, completeness, "
    "and appropriateness for the target level: {level}. Content type: {content_type}. "
    'Return JSON: {{"valid": bool, "issues": [string], "suggestions": [string]}}'
)
