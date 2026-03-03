"""Runtime mutable state — lives for the lifetime of the server process."""
from __future__ import annotations

_provider_override: str | None = None


def get_provider_override() -> str | None:
    return _provider_override


def set_provider_override(provider: str) -> None:
    global _provider_override
    _provider_override = provider
