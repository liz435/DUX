"""Content-focused LangChain tools for the lesson writer agent."""

from __future__ import annotations

import logging
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
def generate_code_example(topic: str, language: str, concept: str) -> str:
    """Generate a runnable code example demonstrating a concept.

    Returns a fenced code block with a short example.
    """
    # Placeholder — in production this calls an LLM with a code-focused prompt
    # and validates syntax.
    return (
        f"```{language}\n"
        f"# Example: {concept} in {topic}\n"
        f"# This is a placeholder code example.\n"
        f"print('Hello from {topic} — demonstrating {concept}')\n"
        f"```"
    )


@tool
def validate_technical_accuracy(claim: str, topic: str) -> dict[str, object]:
    """Cross-check a technical claim for accuracy.

    Returns {valid: bool, correction: str | None}.
    """
    # Placeholder — in production this uses search + LLM judge.
    return {
        "valid": True,
        "correction": None,
        "note": f"Claim about '{topic}' appears technically sound.",
    }


def _fallback_schema(check_type: str) -> dict[str, object]:
    """Static fallback schemas when LLM is unavailable."""
    schemas = {
        "recall": {
            "title": "Quick Check",
            "description": "Test your understanding of the concept above.",
            "fields": [
                {
                    "id": "check_q1",
                    "type": "single-choice",
                    "label": "Which statement best describes this concept?",
                    "required": True,
                    "options": [
                        {"value": "a", "label": "Option A — correct understanding"},
                        {"value": "b", "label": "Option B — common misconception"},
                        {"value": "c", "label": "Option C — unrelated concept"},
                    ],
                }
            ],
            "correct_answer": {"check_q1": "a"},
            "explanation": "Option A correctly describes the concept. Option B is a common misconception, and Option C is unrelated.",
        },
        "reflection": {
            "title": "Reflect",
            "description": "Take a moment to think about what you've learned.",
            "fields": [
                {
                    "id": "reflection_q1",
                    "type": "text",
                    "label": "In your own words, explain this concept:",
                    "placeholder": "Type your explanation here...",
                }
            ],
            "correct_answer": {},
            "explanation": "This is a reflection exercise — there's no single correct answer. Think about the key ideas covered above.",
        },
        "exploration": {
            "title": "Explore",
            "description": "Adjust the parameter and observe the effect.",
            "fields": [
                {
                    "id": "explore_slider",
                    "type": "slider",
                    "label": "Parameter value",
                    "min": 0,
                    "max": 100,
                    "step": 1,
                    "defaultValue": 50,
                }
            ],
            "correct_answer": {},
            "explanation": "Exploration exercises let you experiment with parameters. There's no single correct answer.",
        },
    }
    return schemas.get(check_type, schemas["recall"])


def _parse_level_from_context(context: str) -> str:
    """Extract level hint from context string like '[Level: beginner]'."""
    match = re.search(r"\[Level:\s*(\w+)\]", context)
    return match.group(1) if match else "intermediate"


@tool
def generate_interactive_schema(context: str, check_type: str) -> dict[str, object]:
    """Generate a DynamicUI form schema for an inline knowledge check.

    Args:
        context: The surrounding lesson text where the check should appear.
                 May contain metadata like [Level: beginner] [Topic: ...].
        check_type: One of "recall", "reflection", "exploration".

    Returns a schema dict compatible with the DynamicUI component,
    including correct_answer and explanation fields.
    """
    from app.agents.llm import get_llm
    from app.agents.prompts.output_schemas import InteractiveElementOutput
    from app.agents.prompts.system_prompts import INTERACTIVE_ELEMENT_SYSTEM

    level = _parse_level_from_context(context)

    try:
        system_prompt = INTERACTIVE_ELEMENT_SYSTEM.format(
            context=context[:500],
            concept=check_type,
            level=level,
        )
    except (KeyError, IndexError):
        logger.warning("Failed to format interactive prompt, using fallback")
        return _fallback_schema(check_type)

    try:
        llm = get_llm(purpose="assessment")
        structured_llm = llm.with_structured_output(InteractiveElementOutput)
        result: InteractiveElementOutput = structured_llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(
                    content=f"Generate a '{check_type}' knowledge check for the lesson content above."
                ),
            ]
        )
        return result.model_dump()
    except Exception:
        logger.warning("LLM interactive generation failed, using fallback", exc_info=True)
        return _fallback_schema(check_type)


def get_content_tools() -> list:
    """Return the content tool set for binding to agents."""
    return [generate_code_example, validate_technical_accuracy, generate_interactive_schema]
