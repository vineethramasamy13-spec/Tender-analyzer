"""
Configuration module for Tender Analyzer Backend.
Loads all settings from environment variables using pydantic-settings.
"""

import os
from pathlib import Path
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

# ---------------------------------------------------------------------------
# Base directory
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    """All application settings loaded from .env or environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------ AI keys
    GROQ_API_KEY: str = Field(default="", description="Groq API key for Llama 3.3 70B")
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")

    # ------------------------------------------------------------------ MongoDB
    MONGODB_URI: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URI",
    )
    MONGODB_DB_NAME: str = Field(default="tender_analyzer", description="MongoDB database name")

    # ------------------------------------------------------------------ ChromaDB
    CHROMADB_HOST: str = Field(default="localhost", description="ChromaDB host")
    CHROMADB_PORT: int = Field(default=8001, description="ChromaDB port")
    CHROMADB_PERSIST_DIR: str = Field(
        default=str(BASE_DIR / "chroma_db"),
        description="ChromaDB persistence directory",
    )

    # ------------------------------------------------------------------ Google CSE
    GOOGLE_CSE_API_KEY: str = Field(default="", description="Google Custom Search API key")
    GOOGLE_CSE_ID: str = Field(default="", description="Google Custom Search Engine ID")

    # ------------------------------------------------------------------ SMTP
    SMTP_HOST: str = Field(default="", description="SMTP host address")
    SMTP_PORT: int = Field(default=587, description="SMTP port")
    SMTP_USERNAME: str = Field(default="", description="SMTP username / email")
    SMTP_PASSWORD: str = Field(default="", description="SMTP password")
    SMTP_SENDER: str = Field(default="", description="SMTP sender address")

    # ------------------------------------------------------------------ App
    BACKEND_URL: str = Field(default="http://localhost:8000", description="Backend base URL")
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="Frontend base URL")
    SECRET_KEY: str = Field(
        default="change-me-in-production-secret-key-at-least-32-chars",
        description="JWT / session secret key",
    )
    ENVIRONMENT: str = Field(default="development", description="Environment: development/production")

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if v == "change-me-in-production-secret-key-at-least-32-chars":
            raise ValueError("SECRET_KEY must be changed from the default placeholder")
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v

    # ------------------------------------------------------------------ Storage
    UPLOAD_DIR: str = Field(default=str(BASE_DIR / "uploads"), description="Directory for uploaded PDFs")
    REPORTS_DIR: str = Field(default=str(BASE_DIR / "reports"), description="Directory for generated PDF reports")
    MAX_UPLOAD_SIZE_MB: int = Field(default=50, description="Max PDF upload size in MB")

    # ------------------------------------------------------------------ Derived helpers
    @property
    def upload_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def reports_path(self) -> Path:
        p = Path(self.REPORTS_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


# ---------------------------------------------------------------------------
# Client singletons – initialised lazily so import never fails even without keys
# ---------------------------------------------------------------------------

_groq_client = None
_gemini_model = None


def get_groq_client(api_key: str = None):
    """Return a Groq client instance, optionally using a user's key."""
    if api_key:
        try:
            from groq import Groq  # type: ignore
            return Groq(api_key=api_key)
        except Exception as exc:
            print(f"[config] Could not initialise custom user Groq client: {exc}")
            
    global _groq_client
    if _groq_client is None:
        try:
            from groq import Groq  # type: ignore

            settings = get_settings()
            if settings.GROQ_API_KEY:
                _groq_client = Groq(api_key=settings.GROQ_API_KEY)
        except Exception as exc:  # pragma: no cover
            print(f"[config] Could not initialise Groq client: {exc}")
    return _groq_client


def get_gemini_model(model_name: str = "gemini-2.5-flash", api_key: str = None):
    """Return a Gemini GenerativeModel instance, optionally using a user's key."""
    if api_key:
        try:
            import google.generativeai as genai  # type: ignore
            genai.configure(api_key=api_key)
            return genai.GenerativeModel(model_name)
        except Exception as exc:
            print(f"[config] Could not configure custom user Gemini client: {exc}")
            
    global _gemini_model
    if _gemini_model is None:
        try:
            import google.generativeai as genai  # type: ignore

            settings = get_settings()
            if settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                _gemini_model = genai.GenerativeModel(model_name)
        except Exception as exc:  # pragma: no cover
            print(f"[config] Could not initialise Gemini client: {exc}")
    return _gemini_model


# Convenience exports
settings = get_settings()
