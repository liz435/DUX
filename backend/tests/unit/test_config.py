from __future__ import annotations

from app.config import Settings, get_settings


class TestSettings:
    def test_default_settings(self) -> None:
        settings = Settings()
        assert settings.llm_provider == "openai"
        assert settings.port == 8000
        assert settings.llm_temperature == 0.7
        assert "http://localhost:5173" in settings.cors_origins

    def test_get_settings_returns_instance(self) -> None:
        settings = get_settings()
        assert isinstance(settings, Settings)
