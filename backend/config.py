import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Core Application Settings
    APP_ENV: str = "development"
    
    # JWT Secrets (Strictly Required in Production, fallback for dev)
    AUTH_SECRET_KEY: str = "fallback_secret_key_for_development_only"
    
    # Database Settings
    DATABASE_URL: Optional[str] = None
    DB_NAME: str = "freshguard_core"
    DB_USER: str = "fresh_admin"
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    
    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Optional Third-Party APIs
    GEMINI_API_KEY: Optional[str] = None
    FREELLMAPI_KEY: Optional[str] = None
    FREELLMAPI_BASE_URL: str = "http://localhost:3001/v1"
    FREELLMAPI_MODEL: str = "gemini-2.5-flash"
    
    # Inworld AI Real-Time Agent Engine
    INWORLD_API_KEY: Optional[str] = None
    INWORLD_API_SECRET: Optional[str] = None
    INWORLD_SCENE: Optional[str] = None
    INWORLD_CHARACTER: Optional[str] = None
    
    ISRO_BHOONIDHI_USER_ID: Optional[str] = None
    ISRO_BHOONIDHI_PASSWORD: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
