"""
Application configuration using Pydantic Settings
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Environment
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)

    # Project Info
    PROJECT_NAME: str = Field(default="Travorier API")
    VERSION: str = Field(default="1.0.0")
    API_V1_PREFIX: str = Field(default="/api/v1")

    # Supabase
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_SERVICE_KEY: str = Field(..., description="Supabase service role key")
    SUPABASE_ANON_KEY: str = Field(..., description="Supabase anon key")

    # Stripe
    STRIPE_SECRET_KEY: str = Field(..., description="Stripe secret key")
    STRIPE_PUBLISHABLE_KEY: str = Field(..., description="Stripe publishable key")
    STRIPE_WEBHOOK_SECRET: str = Field(..., description="Stripe webhook secret")

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = Field(
        default="./firebase-credentials.json",
        description="Path to Firebase service account JSON"
    )

    # JWT
    JWT_SECRET_KEY: str = Field(..., description="Secret key for JWT signing")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)

    # CORS
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:19006",
        description="Comma-separated allowed origins"
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS into a list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    # Sentry
    SENTRY_DSN: str = Field(default="", description="Sentry DSN for error tracking")

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60)

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
