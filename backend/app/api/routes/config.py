from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.models.api import ProviderConfigResponse, SwitchProviderRequest
from app.state import get_provider_override, set_provider_override

router = APIRouter(prefix="/api/config")

_SUPPORTED = {"openai", "anthropic"}


@router.get("/provider", response_model=ProviderConfigResponse)
async def get_provider_config() -> ProviderConfigResponse:
    settings = get_settings()
    available: list[str] = []
    if settings.openai_api_key:
        available.append("openai")
    if settings.anthropic_api_key:
        available.append("anthropic")

    current = get_provider_override() or settings.llm_provider
    return ProviderConfigResponse(current_provider=current, available_providers=available)


@router.post("/provider", response_model=ProviderConfigResponse)
async def switch_provider(body: SwitchProviderRequest) -> ProviderConfigResponse:
    if body.provider not in _SUPPORTED:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{body.provider}'")

    settings = get_settings()
    available: list[str] = []
    if settings.openai_api_key:
        available.append("openai")
    if settings.anthropic_api_key:
        available.append("anthropic")

    if body.provider not in available:
        raise HTTPException(
            status_code=400,
            detail=f"Provider '{body.provider}' has no API key configured",
        )

    set_provider_override(body.provider)
    return ProviderConfigResponse(current_provider=body.provider, available_providers=available)
