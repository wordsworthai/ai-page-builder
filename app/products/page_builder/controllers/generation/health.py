"""GET /health."""
from fastapi import APIRouter

from app.shared.services.streaming.generation_redis_service import generation_redis_service


router = APIRouter()


@router.get("/health")
async def generation_health_check():
    """Health check for generation service."""
    redis_ok = generation_redis_service.ping()
    return {
        "status": "healthy" if redis_ok else "degraded",
        "service": "generation",
        "redis_connected": redis_ok,
    }
