from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # LLM Provider
    llm_provider: str = "openai"
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # Model selection
    llm_model_capable: str = "gpt-4o"
    llm_model_fast: str = "gpt-4o-mini"
    llm_temperature: float = 0.7

    # Optional: LangSmith
    langsmith_api_key: str = ""
    langsmith_project: str = "dux-course-platform"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


def get_settings() -> Settings:
    return Settings()
