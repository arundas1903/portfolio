from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    cors_origins: str = ""
    chat_access_password: str = ""
    chat_rate_limit: int = 10
    chat_rate_window_minutes: int = 30

    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    @property
    def chat_rate_window_seconds(self) -> int:
        return self.chat_rate_window_minutes * 60

    @property
    def openai_configured(self) -> bool:
        return bool(self.openai_api_key.strip())

    @property
    def chat_password_required(self) -> bool:
        return bool(self.chat_access_password.strip())

    @property
    def allowed_cors_origins(self) -> list[str]:
        defaults = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://arundas.me",
            "https://www.arundas.me",
            "https://arundas1903.github.io",
        ]
        extra = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return defaults + extra


settings = Settings()
