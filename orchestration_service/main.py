import os

# Required by agent orchestration (eval_utils.compile_template_utils) at import time.
# Set before any import that can pull in the package.
os.environ.setdefault("ENVIRONMENT", "local")
os.environ.setdefault("NODE_SERVER_URL", os.environ.get("NODE_SERVER_URL", "http://localhost:3002"))

from orchestration_service.config import settings
import logging

# Push S3_BUCKET_NAME and region before any wwai_agent_orchestration import so
# template_json_builder (which reads os.environ at import time) sees the right values.
# template_json_builder reads AWS_DEFAULT_REGION (not AWS_REGION).
os.environ.setdefault("S3_BUCKET_NAME", settings.s3_bucket_name)
os.environ.setdefault("AWS_DEFAULT_REGION", settings.aws_region)

# AGENT_MONGODB_URL first, secret fallback: configure package DB before any import that touches db_manager.
# If URI is set, the first (and only) connection uses it; else the package uses from_env() (Secret Manager).
_uri = getattr(settings, "agent_mongodb_url", None) or getattr(settings, "mongodb_url", None)
if _uri:
    try:
        from wwai_agent_orchestration.core.database import configure_database
        _db_name = getattr(settings, "mongodb_database", "template_generation") or "template_generation"
        configure_database(connection_uri=_uri, db_name=_db_name)
        logging.getLogger(__name__).info("Orchestration package MongoDB configured from AGENT_MONGODB_URL / MONGODB_URL")
    except Exception as e:
        logging.getLogger(__name__).warning(f"Orchestration package DB configuration skipped: {e}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from orchestration_service.routers import workflows, health

# Push config into os.environ so agent orchestration sees them (it reads via os.getenv)
if getattr(settings, "openai_api_key", None):
    os.environ.setdefault("OPENAI_API_KEY", settings.openai_api_key)
if getattr(settings, "anthropic_api_key", None):
    os.environ.setdefault("ANTHROPIC_API_KEY", settings.anthropic_api_key)
if getattr(settings, "gemini_api_key", None):
    os.environ.setdefault("GEMINI_API_KEY", settings.gemini_api_key)
if getattr(settings, "aws_access_key_id", None):
    os.environ.setdefault("AWS_ACCESS_KEY_ID", settings.aws_access_key_id)
if getattr(settings, "aws_secret_access_key", None):
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", settings.aws_secret_access_key)
if getattr(settings, "aws_region", None):
    os.environ.setdefault("AWS_REGION", settings.aws_region)

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(
    title="WWAI Orchestration Service",
    description="Microservice for AI Orchestration Workflows",
    version="0.1.0"
)

# CORS (allow all for internal service, can be restricted later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(workflows.router)
app.include_router(health.router)

@app.on_event("startup")
async def startup_event():
    logging.info(f"Starting Orchestration Service in {settings.environment} mode")

@app.on_event("shutdown")
async def shutdown_event():
    logging.info("Shutting down Orchestration Service")
