"""GET /metrics, GET /{id}/status, GET /{id}/metrics."""
import logging
import time
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.db import get_async_db_session
from app.core.db_mongo import get_mongo_database
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.products.page_builder.schemas.generation.generation import (
    GenerationStatusResponse,
    GenerationPerformanceMetrics,
    NodeExecutionEntry,
)
from app.shared.services.streaming.generation_redis_service import generation_redis_service
from app.shared.services.streaming.generation_metrics_store import generation_metrics_store
from app.shared.utils.user_helpers import get_business_id_from_user
from app.shared.services.auth.users_service import get_current_user
from app.products.page_builder.controllers.generation.helpers import resolve_generation_context


router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/metrics", response_model=list[GenerationPerformanceMetrics])
async def list_generation_metrics(
    limit: int = 50,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """List recent performance metrics for the current user's business. Requires RECORD_PERFORMANCE_METRICS=True."""
    if not config.record_performance_metrics:
        raise HTTPException(
            status_code=404, detail="Performance metrics are not recorded"
        )
    business_id = await get_business_id_from_user(current_user, db)
    mongo_db = await get_mongo_database("template_generation")
    cursor = (
        mongo_db["generation_performance_metrics"]
        .find({"business_id": str(business_id)})
        .sort("recorded_at", -1)
        .limit(min(limit, 100))
    )
    docs = await cursor.to_list(length=min(limit, 100))
    result = []
    for doc in docs:
        doc.pop("_id", None)
        result.append(GenerationPerformanceMetrics.model_validate(doc))
    return result


@router.get("/{generation_version_id}/status", response_model=GenerationStatusResponse)
async def get_generation_status(
    generation_version_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Poll generation status.
    SIMPLIFIED: execution_log entries no longer have phase/parallel fields.
    """
    endpoint_start = time.time()
    try:
        db_start = time.time()
        business_id = await get_business_id_from_user(current_user, db)
        generation, page, website = await resolve_generation_context(
            generation_version_id, db, business_id=business_id
        )
        db_time = time.time() - db_start

        redis_start = time.time()
        redis_status = generation_redis_service.get_full_status(generation_version_id)
        redis_time = time.time() - redis_start

        if redis_status["status"] != "unknown":
            started_at = None
            if redis_status.get("started_at"):
                try:
                    started_at = datetime.fromisoformat(redis_status["started_at"])
                except (ValueError, TypeError):
                    started_at = generation.created_at

            execution_log = []
            for entry_dict in redis_status.get("execution_log", []):
                execution_log.append(
                    NodeExecutionEntry(
                        node_name=entry_dict.get("node_name", ""),
                        display_name=entry_dict.get("display_name", ""),
                        status=entry_dict.get("status", "completed"),
                        output_summary=entry_dict.get("output_summary"),
                        output_type=entry_dict.get("output_type", "text"),
                        started_at=entry_dict.get("started_at"),
                        completed_at=entry_dict.get("completed_at"),
                        duration_ms=entry_dict.get("duration_ms"),
                    )
                )

            nodes_completed = redis_status.get("nodes_completed", 0)
            legacy_progress = min(95, nodes_completed * 8)
            if redis_status["status"] == "completed":
                legacy_progress = 100

            total_time = time.time() - endpoint_start
            if total_time > 0.05:
                logger.warning(
                    f"Slow status endpoint for {generation_version_id}: "
                    f"total={total_time*1000:.2f}ms, db={db_time*1000:.2f}ms, redis={redis_time*1000:.2f}ms"
                )

            response = GenerationStatusResponse(
                generation_version_id=generation_version_id,
                status=redis_status["status"],
                started_at=started_at,
                elapsed_seconds=redis_status.get("elapsed_seconds", 0),
                current_node=redis_status.get("current_node"),
                current_node_display=redis_status.get("current_node_display"),
                nodes_completed=nodes_completed,
                execution_log=execution_log,
                preview_link=redis_status.get("preview_link") or page.preview_link,
                error_message=redis_status.get("error_message"),
                progress=legacy_progress,
                dev_task_id=str(generation_version_id),
                query_hash=generation.query_hash,
                created_at=generation.created_at,
                completed_at=generation.completed_at,
            )
            if config.record_performance_metrics:
                response_bytes = len(response.model_dump_json().encode("utf-8"))
                generation_metrics_store.record_status_poll(
                    str(generation_version_id), response_bytes, redis_time * 1000
                )
            return response

        elapsed_seconds = 0
        if generation.created_at:
            end_time = generation.completed_at or datetime.now(UTC).replace(tzinfo=None)
            elapsed_seconds = int(
                (end_time - generation.created_at).total_seconds()
            )

        total_time = time.time() - endpoint_start
        if total_time > 0.05:
            logger.warning(
                f"Slow status endpoint (fallback) for {generation_version_id}: "
                f"total={total_time*1000:.2f}ms, db={db_time*1000:.2f}ms"
            )

        return GenerationStatusResponse(
            generation_version_id=generation_version_id,
            status=generation.status,
            started_at=generation.created_at,
            elapsed_seconds=elapsed_seconds,
            current_node=None,
            current_node_display=None,
            nodes_completed=0,
            execution_log=[],
            preview_link=page.preview_link,
            error_message=generation.error_message,
            progress=100 if generation.status == "completed" else 0,
            dev_task_id=str(generation_version_id),
            query_hash=generation.query_hash,
            created_at=generation.created_at,
            completed_at=generation.completed_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve status: {str(e)}"
        )


@router.get(
    "/{generation_version_id}/metrics",
    response_model=GenerationPerformanceMetrics,
)
async def get_generation_metrics(
    generation_version_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get persisted performance metrics for a generation. Requires ownership. 404 if metrics disabled or not found."""
    if not config.record_performance_metrics:
        raise HTTPException(
            status_code=404, detail="Performance metrics are not recorded"
        )
    mongo_db = await get_mongo_database("template_generation")
    doc = await mongo_db["generation_performance_metrics"].find_one(
        {"generation_version_id": str(generation_version_id)}
    )
    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Metrics not found for this generation",
        )
    doc.pop("_id", None)
    return GenerationPerformanceMetrics.model_validate(doc)
