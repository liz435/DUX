"""LLM provider abstraction — factory functions for chat models."""

from __future__ import annotations

from typing import Literal

from langchain_core.language_models.chat_models import BaseChatModel

from app.config import get_settings


def get_llm(
    purpose: Literal["planning", "writing", "assessment", "validation"] = "writing",
    streaming: bool = False,
) -> BaseChatModel:
    """Return a chat model configured for the given purpose.

    * ``planning`` / ``writing`` / ``assessment`` → capable model
    * ``validation`` → fast model (cheaper, lower latency)
    """
    settings = get_settings()
    is_fast = purpose == "validation"
    model_name = settings.llm_model_fast if is_fast else settings.llm_model_capable

    if settings.llm_provider == "anthropic":
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=model_name,
            api_key=settings.anthropic_api_key,
            temperature=settings.llm_temperature,
            streaming=streaming,
        )

    # Default: OpenAI-compatible
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=model_name,
        api_key=settings.openai_api_key,
        temperature=settings.llm_temperature,
        streaming=streaming,
    )


def get_llm_with_fallback(
    purpose: Literal["planning", "writing", "assessment", "validation"] = "writing",
    streaming: bool = False,
) -> BaseChatModel:
    """Return a capable model with a fast-model fallback."""
    primary = get_llm(purpose=purpose, streaming=streaming)
    fallback = get_llm(purpose="validation", streaming=streaming)
    return primary.with_fallbacks([fallback])
