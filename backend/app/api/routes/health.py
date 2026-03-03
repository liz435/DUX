from __future__ import annotations

import httpx
from fastapi import APIRouter

from app.config import get_settings
from app.models.api import ApiKeyStatusResponse, HealthResponse

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse()


@router.get("/health/api-key", response_model=ApiKeyStatusResponse)
async def api_key_status() -> ApiKeyStatusResponse:
    settings = get_settings()
    provider = settings.llm_provider

    if provider == "anthropic":
        key = settings.anthropic_api_key
        model = settings.llm_model_capable
        if not key:
            return ApiKeyStatusResponse(connected=False, provider=provider, model=model, error="API key not set")
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://api.anthropic.com/v1/models",
                    headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
                )
            if resp.status_code == 200:
                return ApiKeyStatusResponse(connected=True, provider=provider, model=model)
            return ApiKeyStatusResponse(
                connected=False, provider=provider, model=model,
                error=f"HTTP {resp.status_code}"
            )
        except Exception as exc:
            return ApiKeyStatusResponse(connected=False, provider=provider, model=model, error=str(exc))

    # Default: OpenAI
    key = settings.openai_api_key
    model = settings.llm_model_capable
    if not key:
        return ApiKeyStatusResponse(connected=False, provider=provider, model=model, error="API key not set")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {key}"},
            )
        if resp.status_code == 200:
            return ApiKeyStatusResponse(connected=True, provider=provider, model=model)
        return ApiKeyStatusResponse(
            connected=False, provider=provider, model=model,
            error=f"HTTP {resp.status_code}"
        )
    except Exception as exc:
        return ApiKeyStatusResponse(connected=False, provider=provider, model=model, error=str(exc))
