"""Redis Configuration for Generation Tracking"""
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


def _get_env_files() -> List[str]:
    """
    Get environment files to load based on ENV_FILE environment variable.
    
    Examples:
        ENV_FILE=prod.env -> loads prod.env
        ENV_FILE=uat.env -> loads uat.env
        No ENV_FILE -> loads local.env, .env (default - does NOT load prod.env)
    """
    env_file = os.environ.get("ENV_FILE")
    if env_file:
        return [env_file]
    return ["local.env", ".env"]


class RedisConfig(BaseSettings):
    """Redis configuration for generation progress tracking"""
    
    model_config = SettingsConfigDict(
        env_file=_get_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Redis Connection (same instance as LangGraph caching)
    # Default to localhost for local development, override with env var for production
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""  # No password for local Redis
    
    # TTL for generation progress data (1 hour)
    GENERATION_PROGRESS_TTL: int = 3600  # seconds


# Singleton instance
# NOTE: This is created at module import time. If you change env files,
# you MUST restart the server for changes to take effect.
redis_config = RedisConfig()