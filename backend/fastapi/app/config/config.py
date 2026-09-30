import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "Asuna AI Backend"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    SECRET_KEY: str = "asuna_ai_super_secret_jwt_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database Settings
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/asuna_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI & LLM Settings
    DEFAULT_LLM_PROVIDER: str = "gemini"  # gemini, openai, ollama
    OPENAI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Voice Providers
    STT_PROVIDER: str = "mock"  # mock, whisper, deepgram
    TTS_PROVIDER: str = "mock"  # mock, elevenlabs, gtts
    VAD_THRESHOLD: float = 0.5

    # Gesture & Vision Settings
    GESTURE_CONFIDENCE_THRESHOLD: float = 0.75
    GESTURE_DEBOUNCE_MS: int = 150
    CAMERA_FRAME_RATE_FPS: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
