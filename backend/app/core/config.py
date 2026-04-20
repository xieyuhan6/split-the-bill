from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "SplitBill API"
    api_v1_prefix: str = "/api/v1"
    debug: bool = True
    exchangerates_api_key: str = ""

    # Keep a default local SQLite URL so the project can start immediately.
    database_url: str = "sqlite+aiosqlite:///./splitbill.db"

    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
