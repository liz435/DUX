from __future__ import annotations

from fastapi import APIRouter

from app.models.api import HealthResponse

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse()
