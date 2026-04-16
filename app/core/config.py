"""
Base application configuration with automatic environment loading.
Uses pydantic-settings to automatically load from .env files and environment variables.
"""

import os
from typing import List, Optional
from urllib.parse import quote_plus

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _get_env_files() -> List[str]:
    """
    Get environment files to load based on ENV_FILE environment variable.

    Examples:
        ENV_FILE=prod.env -> loads prod.env
        ENV_FILE=uat.env -> loads uat.env
        No ENV_FILE -> loads local.env, .env (default)
    """
    env_file = os.environ.get("ENV_FILE")
    if env_file:
        return [env_file]
    return ["local.env", ".env"]


class BaseConfig(BaseSettings):
    """
    Base configuration class with automatic environment loading.

    This automatically loads values from:
    1. Environment variables
    2. .env files (local.env, .env, or custom via ENV_FILE)
    3. Default values defined here
    """

    model_config = SettingsConfigDict(
        # Load from these files in order (later files override earlier ones)
        # Can be overridden by ENV_FILE environment variable
        env_file=_get_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Single source of truth; ENV and ENVIRONMENT both map here (see validation_alias).
    environment: str = Field(
        default="development",
        validation_alias=AliasChoices("environment", "env"),
        description="Environment: local, development, uat, production",
    )

    @property
    def env(self) -> str:
        """Legacy alias for `environment` (same value)."""
        return self.environment

    # Generation performance metrics (per-generation tracking, Mongo persist, GET API)
    record_performance_metrics: bool = Field(
        default=True,
        description="When True, accumulate and persist per-generation metrics (node-updates, status-polls, Redis timings) to MongoDB; expose GET /generations/{id}/metrics. Set RECORD_PERFORMANCE_METRICS=false to disable.",
    )

    # Load-test endpoint (internal; no user auth). For deployed load-test, set LOAD_TEST_SECRET and LOAD_TEST_BUSINESS_ID.
    load_test_secret: Optional[str] = Field(
        default=None,
        description="When set, enables POST /api/generations/internal/trigger-load-test; requires header X-Load-Test-Secret to match.",
    )
    load_test_business_id: Optional[str] = Field(
        default=None,
        description="UUID of the business to use for load-test generations. When LOAD_TEST_SECRET is set, this is required; endpoint will get-or-create Business and BusinessCredits.",
    )

    # Security & Authentication
    secret_key: str = Field(
        default="example-key", description="JWT signing key - CHANGE IN PRODUCTION!"
    )
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(
        default=10080, description="JWT expiration (7 days)"
    )
    jwt_cookie_name: str = Field(default="jwt", description="JWT cookie name")
    reset_token_expire_hours: int = Field(
        default=24, description="Password reset token expiration (24 hours)"
    )
    verification_token_expire_hours: int = Field(
        default=24, description="Email verification token expiration (24 hours)"
    )

    # Cookie Configuration
    cookie_domain: Optional[str] = Field(
        default=None,
        description="Cookie domain for cross-subdomain auth. Use '.domain.com' for production, None for uat/dev"
    )

    # Domain & URLs
    domain: str = Field(
        default="http://localhost:3000", description="Application domain"
    )
    # Backend URL for internal callbacks
    backend_url: str = Field(
        default="http://localhost:8020", description="Backend application URL"
    )
    redirect_after_login: str = Field(
        default="http://localhost:5173/dashboard", description="Redirect URL after login"
    )
    frontend_url: str = Field(
        default="http://localhost:5173",
        description="Frontend application URL for CORS and email links"
    )

    # Google OAuth2
    google_oauth2_client_id: Optional[str] = Field(
        default=None, description="Google OAuth2 client ID"
    )
    google_oauth2_secret: Optional[str] = Field(
        default=None, description="Google OAuth2 secret"
    )
    google_oauth2_redirect_uri: Optional[str] = Field(
        default=None, description="Google OAuth2 redirect URI (must match Google Cloud Console exactly)"
    )

    # Database Configuration
    db_username: str = Field(
        default="pagebuilder", description="Database username"
    )
    db_password: str = Field(
        default="pagebuilder", description="Database password"
    )
    db_host: str = Field(default="localhost", description="Database host")
    db_port: str = Field(default="54323", description="Database port")
    db_database: str = Field(default="pagebuilder", description="Database name")
    db_sslmode: str = Field(default="require", description="Database SSL mode")

    # MongoDB Configuration
    mongodb_url: Optional[str] = Field(
        default=None,
        description="MongoDB connection URL (full URI). If provided, overrides component-based configuration"
    )
    mongodb_host: str = Field(
        default="localhost",
        description="MongoDB host"
    )
    mongodb_port: int = Field(
        default=27017,
        description="MongoDB port"
    )
    mongodb_username: Optional[str] = Field(
        default=None,
        description="MongoDB username"
    )
    mongodb_password: Optional[str] = Field(
        default=None,
        description="MongoDB password"
    )
    mongodb_database: str = Field(
        default="businesses",
        description="MongoDB database name"
    )

    # RAGFlow Configuration
    # Two modes: mock (RAGFLOW_USE_MOCK=true) proxies to /mock/ragflow/completion
    # for canned dev responses; real (false) hits the actual RAGFlow retrieval
    # endpoint and streams answers from OpenAI. See chat controller docstring.
    ragflow_base_url: str = Field(
        default="http://localhost:8020/mock/ragflow",
        description="RAGFlow API base URL (real instance or mock endpoint)",
    )
    ragflow_api_key: str = Field(
        default="mock-dev-key",
        description="RAGFlow API key",
    )
    ragflow_use_mock: bool = Field(
        default=True,
        description="When true, use mock endpoint; when false, use real RAGFlow retrieval + OpenAI",
    )
    ragflow_dataset_ids: str = Field(
        default="",
        description="Comma-separated RAGFlow dataset IDs for /api/v1/retrieval",
    )

    # OpenAI — used for chat answer generation when ragflow_use_mock=false
    openai_api_key: str = Field(default="", description="OpenAI API key for chat generation")
    openai_model: str = Field(default="gpt-5.2", description="OpenAI model for chat generation")

    # Query rewrite — optional LLM call to optimize conversational questions for retrieval
    query_rewrite_enabled: bool = Field(
        default=False,
        description="When true, rewrite user questions into optimized retrieval queries before calling RAGFlow",
    )
    query_rewrite_model: str = Field(
        default="gpt-4o-mini",
        description="Lightweight model used for query rewriting",
    )

    # Nango Connector (Google Drive OAuth + sync)
    nango_secret_key: Optional[str] = Field(
        default=None, description="Nango secret key for server-side API calls"
    )
    nango_webhook_secret: Optional[str] = Field(
        default=None, description="Nango webhook HMAC secret for signature verification"
    )
    nango_base_url: str = Field(
        default="https://api.nango.dev", description="Nango API base URL"
    )

    # Agent Orchestration MongoDB (separate store for orchestration artifacts)
    agent_mongodb_url: Optional[str] = Field(
        default=None,
        description="Agent orchestration MongoDB connection URL (full URI). Overrides default MongoDB for orchestration"
    )
    agent_mongodb_database: str = Field(
        default="scraping_db",
        description="Agent orchestration MongoDB database name"
    )

    # SendGrid Configuration (for email sending)
    sendgrid_api_key: Optional[str] = Field(
        default=None, description="SendGrid API key for transactional emails"
    )
    sendgrid_from_email: str = Field(
        default="noreply@example.com", description="SendGrid sender email address (must be verified in SendGrid)"
    )
    sendgrid_from_name: str = Field(
        default="PageBuilder", description="SendGrid sender name"
    )

    # Email Configuration (legacy - keeping for backward compatibility)
    mailchimp_api_key: Optional[str] = Field(
        default=None, description="[DEPRECATED] Mailchimp Transactional API key - use SendGrid instead"
    )
    from_email: str = Field(
        default="noreply@example.com", description="[DEPRECATED] Use sendgrid_from_email instead"
    )
    from_name: str = Field(
        default="PageBuilder", description="Default sender name"
    )
    support_email: str = Field(
        default="support@example.com", description="Support email address shown in emails"
    )

    @property
    def database_url(self) -> str:
        """Generate database URL from components."""
        user = quote_plus(self.db_username, safe="")
        password = quote_plus(self.db_password, safe="")
        return (
            f"postgresql+asyncpg://{user}:{password}@"
            f"{self.db_host}:{self.db_port}/{self.db_database}"
        )

    @property
    def mongodb_connection_url(self) -> str:
        """
        Generate MongoDB connection URL from components.
        
        If mongodb_url is provided, it takes precedence.
        Otherwise, constructs URL from individual components.
        For local development, auth is optional.
        For production, auth is required.
        """
        if self.mongodb_url:
            return self.mongodb_url
        
        # Construct URL from components
        if self.mongodb_username and self.mongodb_password:
            return f"mongodb://{self.mongodb_username}:{self.mongodb_password}@{self.mongodb_host}:{self.mongodb_port}/"
        else:
            # Local development - no auth
            return f"mongodb://{self.mongodb_host}:{self.mongodb_port}/"

    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() in ("local", "development", "dev")

    def is_uat(self) -> bool:
        """Check if running in UAT environment."""
        return self.environment.lower() in ("uat", "staging", "test")

    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() in ("production", "prod")

    def get_cookie_domain(self) -> Optional[str]:
        """
        Get cookie domain based on environment
        
        Returns:
            - Production: Configured domain (e.g., '.yourdomain.com')
            - UAT/Dev: None (browser uses exact domain)

        Examples:
            Production: '.yourdomain.com' (shared across subdomains)
            UAT: None (cookie on exact backend URL)
            Development: None (cookie on localhost:8020)
        """
        if self.is_production():
            return self.cookie_domain
        return None

    def get_cookie_samesite(self) -> str:
        """
        Get SameSite cookie policy based on environment
        
        Returns:
            - Production: 'lax' (same-site, more secure)
            - UAT/Dev: 'none' (cross-site, required for different domains)
        """
        if self.is_production():
            return "lax"
        return "none"


# Create a singleton instance for easy importing
config = BaseConfig()

# Export individual variables for backward compatibility
ENV = config.env
SECRET_KEY = config.secret_key
ALGORITHM = config.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = config.access_token_expire_minutes
JWT_COOKIE_NAME = config.jwt_cookie_name
RESET_TOKEN_EXPIRE_HOURS = config.reset_token_expire_hours
VERIFICATION_TOKEN_EXPIRE_HOURS = config.verification_token_expire_hours

DOMAIN = config.domain
REDIRECT_AFTER_LOGIN = config.redirect_after_login
FRONTEND_URL = config.frontend_url
OAUTH_REDIRECT_COOKIE_NAME = "oauth_redirect_after_login"

GOOGLE_OAUTH2_CLIENT_ID = config.google_oauth2_client_id
GOOGLE_OAUTH2_SECRET = config.google_oauth2_secret
GOOGLE_OAUTH2_REDIRECT_URI = config.google_oauth2_redirect_uri

# Database
DB_USERNAME = config.db_username
DB_PASSWORD = config.db_password
DB_HOST = config.db_host
DB_PORT = config.db_port
DB_DATABASE = config.db_database
DB_SSLMODE = config.db_sslmode
DATABASE_URL = config.database_url

# MongoDB
MONGODB_URL = config.mongodb_url
MONGODB_HOST = config.mongodb_host
MONGODB_PORT = config.mongodb_port
MONGODB_USERNAME = config.mongodb_username
MONGODB_PASSWORD = config.mongodb_password
MONGODB_DATABASE = config.mongodb_database

# Agent Orchestration MongoDB
AGENT_MONGODB_URL = config.agent_mongodb_url
AGENT_MONGODB_DATABASE = config.agent_mongodb_database

# SendGrid
SENDGRID_API_KEY = config.sendgrid_api_key
SENDGRID_FROM_EMAIL = config.sendgrid_from_email
SENDGRID_FROM_NAME = config.sendgrid_from_name

# Email (legacy)
MAILCHIMP_API_KEY = config.mailchimp_api_key
FROM_EMAIL = config.from_email
FROM_NAME = config.from_name
SUPPORT_EMAIL = config.support_email

# Nango
NANGO_SECRET_KEY = config.nango_secret_key
NANGO_WEBHOOK_SECRET = config.nango_webhook_secret
NANGO_BASE_URL = config.nango_base_url

# Environment & Cookie Configuration
ENVIRONMENT = config.environment
COOKIE_DOMAIN = config.get_cookie_domain()
COOKIE_SAMESITE = config.get_cookie_samesite()