from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.courses import router as courses_router
from app.api.routes.health import router as health_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="DUX Course Platform API",
    description="Agentic course generation backend powered by LangGraph + LangChain",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses_router)
app.include_router(health_router)
