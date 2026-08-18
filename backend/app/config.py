"""
TechHaven Backend — Configuration
Loads environment variables and provides app-wide settings.
"""

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Groq
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")

    # App
    app_env: str = os.getenv("APP_ENV", "development")
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    admin_email: str = os.getenv("ADMIN_EMAIL", "admin@techhaven.com")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "changeme123")
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 24

    class Config:
        env_file = ".env"


settings = Settings()
