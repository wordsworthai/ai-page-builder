import asyncio
import logging
import os
from pathlib import Path

# Load env file into os.environ so template_json_builder and other packages
# that read via os.getenv() can access credentials (e.g. AWS_ACCESS_KEY_ID).
# ENV_FILE selects the file (default: local.env). In production (Cloud Run),
# env files are excluded from the image — vars come from the platform; we
# skip load_dotenv when the file does not exist.
env_file = os.environ.get("ENV_FILE", "local.env")
env_path = Path(__file__).resolve().parent / env_file
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)

# Ensure S3_BUCKET_NAME and region are in os.environ so template_json_builder
# (which reads os.environ at import time) gets the right values.
# template_json_builder reads AWS_DEFAULT_REGION (not AWS_REGION).
os.environ.setdefault("S3_BUCKET_NAME", "my-pages")
os.environ.setdefault("AWS_DEFAULT_REGION", os.environ.get("AWS_REGION", "us-east-1"))

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.authentication import AuthenticationMiddleware

from app.admin import create_admin
from app.core.auth_backend import JWTAuthenticationBackend
from app.core.config import config, FRONTEND_URL
from app.shared.router import router as shared_router


def _configure_orchestration_database() -> None:
    """Configure wwai_agent_orchestration to use the same MongoDB as the main app."""
    try:
        from wwai_agent_orchestration.core.database import configure_database

        uri = config.agent_mongodb_url or config.mongodb_connection_url
        db_name = config.agent_mongodb_database or config.mongodb_database
        if uri:
            configure_database(connection_uri=uri, db_name=db_name)
            logging.info("✅ wwai_agent_orchestration database configured to use app MongoDB")
        else:
            logging.warning("⚠️ No MongoDB URL set; orchestration package may use its default")
    except Exception as e:
        logging.warning(f"⚠️ Orchestration DB configure_database failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    try:
        from app.core.db_mongo import get_mongo_client
        client = get_mongo_client()
        await client.admin.command('ping')
        logging.info("✅ MongoDB connection verified")
    except Exception as e:
        logging.warning(f"⚠️ MongoDB connection check failed: {e}")

    _configure_orchestration_database()

    yield

    try:
        from app.core.db_mongo import _mongo_client
        if _mongo_client:
            _mongo_client.close()
            logging.info("MongoDB connections closed")
    except Exception:
        pass


middleware = [Middleware(AuthenticationMiddleware, backend=JWTAuthenticationBackend())]

app = FastAPI(debug=True, middleware=middleware, lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

if FRONTEND_URL and FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)

if config.domain and config.domain not in origins:
    origins.append(config.domain)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.example\.com"),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    if not config.is_development() and request.url.path.startswith("/admin"):
        response.headers["Content-Security-Policy"] = "upgrade-insecure-requests"
    return response


admin = create_admin(app)

# Shared (product-agnostic) routes
app.include_router(shared_router)

# Page Builder product routes
from app.products.page_builder.config.auth_hooks import register as register_pb_auth_hooks
from app.products.page_builder.config.plans import register as register_pb_plans
register_pb_plans()
register_pb_auth_hooks()
from app.products.page_builder.router import router as page_builder_router
app.include_router(page_builder_router)

static_directory = "static/static"
if os.path.exists(static_directory):
    app.mount(
        "/static", StaticFiles(directory=static_directory, html=True), name="static"
    )

public_directory = "static/assets"
if os.path.exists(public_directory):
    app.mount(
        "/assets", StaticFiles(directory=public_directory, html=True), name="static"
    )


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and testing"""
    return {"status": "healthy", "service": "Page Builder API"}


@app.get("/robots.txt", response_class=FileResponse)
async def read_robots():
    return FileResponse("static/robots.txt")


@app.get("/sitemap.xml", response_class=FileResponse)
async def read_sitemap():
    return FileResponse("static/sitemap.xml")


@app.get("/{full_path:path}", response_class=HTMLResponse)
async def catch_all(full_path: str):
    index_path = "static/index.html"
    if not os.path.exists(index_path):
        raise HTTPException(status_code=404)
    return FileResponse(index_path, headers={"Document-Policy": "js-profiling"})


logging.basicConfig(level=logging.INFO)
logging.getLogger("sqlalchemy").setLevel(logging.ERROR)

fetch_lock = asyncio.Lock()
plan_lock = asyncio.Lock()
logger = logging.getLogger()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8020)
