from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

def _get_env_files():
    # Helper to find env files (check current dir and parent dir for local.env)
    files = []
    
    # Check explicit ENV_FILE
    env_file = os.environ.get("ENV_FILE")
    if env_file:
        return [env_file]
        
    # Check for local.env in current or parent directory
    if os.path.exists("local.env"):
        files.append("local.env")
    elif os.path.exists("../local.env"):
        # If running from orchestration_service subdir
        files.append("../local.env")
        
    # Always try .env
    files.append(".env")
    
    return files

class Settings(BaseSettings):
    # Service config
    environment: str = "production"
    log_level: str = "INFO"
    
    # MongoDB (orchestration package: AGENT_MONGODB_URL first, else secret fallback)
    agent_mongodb_url: Optional[str] = None  # from AGENT_MONGODB_URL; takes precedence over mongodb_url
    mongodb_url: Optional[str] = None
    mongodb_host: Optional[str] = None
    mongodb_database: str = "template_generation"
    
    # Redis (for workflow cache)
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None
    
    # LLM APIs
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    
    # External APIs
    rapidapi_key: Optional[str] = None
    rapidapi_host: Optional[str] = None
    shutterstock_api_token: Optional[str] = None
        
    # AWS/S3
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    s3_preview_bucket_name: Optional[str] = None

    # Required by agent orchestration (HTML compilation / bundle_pipeline_pkg)
    node_server_url: str = "http://localhost:3002"

    model_config = SettingsConfigDict(
        env_file=_get_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

settings = Settings()
