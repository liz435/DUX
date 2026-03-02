"""Content-focused LangChain tools for the lesson writer agent."""

from __future__ import annotations

from langchain_core.tools import tool


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


@tool
def generate_interactive_schema(context: str, check_type: str) -> dict[str, object]:
    """Generate a DynamicUI form schema for an inline knowledge check.

    Args:
        context: The surrounding lesson text where the check should appear.
        check_type: One of "recall", "reflection", "exploration".

    Returns a schema dict compatible with the DynamicUI component.
    """
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
        },
    }
    return schemas.get(check_type, schemas["recall"])


def get_content_tools() -> list:
    """Return the content tool set for binding to agents."""
    return [generate_code_example, validate_technical_accuracy, generate_interactive_schema]
