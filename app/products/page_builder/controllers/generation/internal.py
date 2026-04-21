"""Internal endpoints: trigger-load-test, node-update, callback, compile-preview."""
import logging
import time
import uuid
from datetime import datetime, UTC

import boto3
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.products.page_builder.config.aws import aws_config
from app.core.db import get_async_db_session
from app.core.db_mongo import get_mongo_database
from app.shared.models import Business, BusinessCredits
from app.products.page_builder.schemas.generation.generation import (
    CompilePreviewResponse,
    GenerationCallbackRequest,
    NodeUpdatePayload,
    TriggerLoadTestRequest,
    TriggerLoadTestResponse,
)
from app.products.page_builder.services.generation.page_generation import GenerationService
from app.shared.services.streaming.generation_redis_service import generation_redis_service
from app.shared.services.streaming.generation_metrics_store import generation_metrics_store
from app.products.page_builder.utils.html_processor import (
    WWAI_BASE_STYLE_FILENAME,
    get_wwai_base_style_css_bytes,
    process_html_for_publishing,
)
from app.products.page_builder.controllers.generation.helpers import resolve_generation_context


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/internal/trigger-load-test",
    response_model=TriggerLoadTestResponse,
    status_code=202,
)
async def trigger_load_test(
    request: Request,
    body: TriggerLoadTestRequest,
    db: AsyncSession = Depends(get_async_db_session),
):
    """Internal load-test trigger: creates generation record and triggers orchestration. No user auth; requires X-Load-Test-Secret header."""
    if not config.load_test_secret:
        raise HTTPException(
            status_code=403,
            detail="Load-test endpoint is disabled (LOAD_TEST_SECRET not set)",
        )
    secret = request.headers.get("X-Load-Test-Secret")
    if not secret or secret != config.load_test_secret:
        raise HTTPException(
            status_code=401, detail="Invalid or missing X-Load-Test-Secret"
        )
    if not config.load_test_business_id:
        raise HTTPException(
            status_code=503,
            detail="Load-test endpoint misconfigured: LOAD_TEST_BUSINESS_ID is required when LOAD_TEST_SECRET is set",
        )
    try:
        load_test_business_id = uuid.UUID(config.load_test_business_id)
    except ValueError:
        raise HTTPException(
            status_code=503, detail="LOAD_TEST_BUSINESS_ID must be a valid UUID"
        )

    business = await db.get(Business, load_test_business_id)
    if not business:
        business = Business(
            business_id=load_test_business_id,
            business_name="Load Test",
        )
        db.add(business)
        await db.flush()
        credits = BusinessCredits(business_id=load_test_business_id)
        db.add(credits)
        await db.commit()
        await db.refresh(business)
        await db.refresh(credits)

    gen_service = GenerationService(db, load_test_business_id)
    assets = await gen_service.provision_assets(
        business_name=body.business_name,
        website_intention=body.website_intention,
    )
    generation_version_id = assets["generation_version_id"]

    await gen_service.run_landing_page_workflow(
        generation_version_id=generation_version_id,
        business_name=body.business_name,
        website_intention=body.website_intention,
        website_tone=body.website_tone,
        yelp_url=body.yelp_url,
        query=body.query,
        palette=body.palette,
        font_family=body.font_family,
        enable_node_updates=body.enable_streaming,
    )

    return TriggerLoadTestResponse(
        generation_version_id=generation_version_id,
        status="started",
        message="Load test generation started",
    )


@router.post("/internal/node-update")
async def generation_node_update(request: NodeUpdatePayload):
    """Internal webhook: orchestration service POSTs node completion updates. No auth."""
    try:
        generation_version_id = uuid.UUID(request.request_id)
        entry_dict = {
            "node_name": request.node_name,
            "display_name": request.display_name,
            "status": request.status,
            "output_summary": request.output_summary,
            "output_type": request.output_type,
            "started_at": request.started_at,
            "completed_at": request.completed_at,
            "duration_ms": request.duration_ms,
        }
        payload_bytes = len(request.model_dump_json().encode("utf-8"))
        redis_start = time.time()
        generation_redis_service.append_execution_entry_dict(
            generation_version_id, entry_dict
        )
        redis_write_ms = (time.time() - redis_start) * 1000
        if config.record_performance_metrics:
            generation_metrics_store.record_node_update(
                str(generation_version_id),
                request.node_name,
                payload_bytes,
                redis_write_ms,
            )
        return {"success": True}
    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid request_id: {e}"
        )
    except Exception as e:
        logger.error(f"Node update failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Node update failed")


@router.post("/internal/callback")
async def generation_callback(
    request: GenerationCallbackRequest,
    db: AsyncSession = Depends(get_async_db_session),
):
    """Internal callback from landing page workflow on completion."""
    try:
        generation_version_id = request.get_generation_version_id()
        logger.info(
            f"Callback received: {generation_version_id} status={request.status}"
        )

        generation, page, website = await resolve_generation_context(
            generation_version_id, db
        )
        business_id = website.business_id
        gen_service = GenerationService(db, business_id)

        await gen_service.handle_completion(
            generation_version_id=generation_version_id,
            status=request.status,
            tokens_used=request.tokens_used,
            estimated_cost_usd=request.estimated_cost_usd,
            error_message=request.error_message,
        )

        await db.refresh(generation)
        final_status = generation.status

        generation_redis_service.update_status(
            generation_version_id, final_status
        )

        if final_status == "completed":
            generation_redis_service.update_progress(
                generation_version_id, 100, "completed"
            )
        elif final_status == "failed":
            if generation.error_message:
                generation_redis_service.set_error(
                    generation_version_id, generation.error_message
                )

        if config.record_performance_metrics:
            rec = generation_metrics_store.get_and_remove(generation_version_id)
            execution_log_length = (
                generation_redis_service.get_nodes_completed_count(
                    generation_version_id
                )
            )
            completed_at_iso = datetime.now(UTC).replace(tzinfo=None).isoformat()
            doc = {
                "generation_version_id": str(generation_version_id),
                "status": final_status,
                "recorded_at": datetime.now(UTC).replace(tzinfo=None),
                "completed_at": completed_at_iso,
                "duration_seconds": None,
                "node_updates": None,
                "status_polls": None,
                "execution_log_length": execution_log_length,
                "business_id": str(business_id),
            }
            if rec:
                started_at = rec.get("started_at")
                doc["started_at"] = started_at
                if started_at:
                    try:
                        end_dt = datetime.fromisoformat(
                            completed_at_iso.replace("Z", "+00:00")
                        )
                        start_dt = datetime.fromisoformat(
                            started_at.replace("Z", "+00:00")
                        )
                        doc["duration_seconds"] = int(
                            (end_dt - start_dt).total_seconds()
                        )
                    except (ValueError, TypeError):
                        pass
                doc["node_updates"] = rec.get("node_updates") or {}
                doc["node_updates"]["attempted"] = getattr(
                    request, "node_updates_attempted", None
                )
                doc["node_updates"]["failed"] = getattr(
                    request, "node_updates_failed", None
                )
                doc["node_updates"]["failed_reasons"] = getattr(
                    request, "node_updates_failed_reasons", None
                ) or {}
                doc["node_updates"]["node_delivery_attempts"] = getattr(
                    request, "node_delivery_attempts", None
                ) or []
                doc["node_updates"]["nodes_received"] = doc["node_updates"].get(
                    "nodes_received"
                ) or []
                doc["status_polls"] = rec.get("status_polls") or {}
            else:
                doc["node_updates"] = {
                    "attempted": getattr(
                        request, "node_updates_attempted", None
                    ),
                    "failed": getattr(request, "node_updates_failed", None),
                    "failed_reasons": getattr(
                        request, "node_updates_failed_reasons", None
                    )
                    or {},
                    "received": 0,
                    "payload_bytes": None,
                    "redis_write_duration_ms": None,
                    "node_delivery_attempts": getattr(
                        request, "node_delivery_attempts", None
                    )
                    or [],
                    "nodes_received": [],
                }
                doc["status_polls"] = {
                    "count": 0,
                    "response_bytes": None,
                    "redis_read_duration_ms": None,
                }
            try:
                mongo_db = await get_mongo_database("template_generation")
                await mongo_db["generation_performance_metrics"].insert_one(doc)
            except Exception as mongo_err:
                logger.warning(
                    f"Failed to persist generation metrics for {generation_version_id}: {mongo_err}"
                )

        logger.info(f"Callback processed: {generation_version_id}")
        return {"success": True, "message": "Callback processed"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Callback failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Callback failed: {str(e)}"
        )


@router.post("/internal/compile-preview", response_model=CompilePreviewResponse)
async def compile_preview(
    generation_version_id: uuid.UUID = Form(...),
    html_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Compile and upload preview HTML to S3."""
    try:
        if not html_file.filename.endswith((".html", ".htm")):
            raise HTTPException(400, "File must be HTML")

        MAX_SIZE = 10 * 1024 * 1024
        content = await html_file.read()
        if len(content) > MAX_SIZE:
            raise HTTPException(400, "File size exceeds 10MB limit")

        generation, page, website = await resolve_generation_context(
            generation_version_id, db
        )
        business_id = website.business_id

        try:
            processed_html = process_html_for_publishing(
                html_content=content.decode("utf-8"),
                page_title=None,
                description=None,
                favicon_filename="favicon.ico",
                inject_tailwind=True,
                wwai_stylesheet_href=WWAI_BASE_STYLE_FILENAME,
            )
            content = processed_html.encode("utf-8")
        except Exception as e:
            logger.warning(f"HTML processing failed: {e}")

        s3_client = boto3.client(
            "s3",
            **({"endpoint_url": aws_config.preview_endpoint_url} if aws_config.preview_endpoint_url else {}),
            aws_access_key_id=aws_config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=aws_config.AWS_SECRET_ACCESS_KEY,
            region_name=aws_config.preview_region,
        )

        s3_key = f"previews/{business_id}/{generation_version_id}/index.html"

        s3_client.put_object(
            Bucket=aws_config.S3_PREVIEW_BUCKET_NAME,
            Key=s3_key,
            Body=content,
            ContentType="text/html",
            CacheControl="no-cache",
        )

        try:
            css_body = get_wwai_base_style_css_bytes()
            css_key = f"previews/{business_id}/{generation_version_id}/{WWAI_BASE_STYLE_FILENAME}"
            s3_client.put_object(
                Bucket=aws_config.S3_PREVIEW_BUCKET_NAME,
                Key=css_key,
                Body=css_body,
                ContentType="text/css",
                CacheControl="no-cache",
            )
        except Exception as e:
            logger.warning(f"WWAI boilerplate CSS upload failed: {e}")

        preview_link = f"https://{aws_config.S3_PREVIEW_BUCKET_NAME}.s3.{aws_config.preview_region}.amazonaws.com/{s3_key}"

        page.preview_link = preview_link
        page.current_generation_id = generation_version_id
        db.add(page)

        generation.preview_link = preview_link
        db.add(generation)

        await db.commit()

        generation_redis_service.set_preview_link(
            generation_version_id, preview_link
        )

        logger.info(f"Preview compiled: {generation_version_id}")

        return CompilePreviewResponse(
            success=True,
            preview_link=preview_link,
            dev_task_id=str(generation_version_id),
            generation_version_id=generation_version_id,
            message="Preview compiled successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Preview compilation failed: {str(e)}", exc_info=True
        )
        raise HTTPException(
            500, f"Failed to compile preview: {str(e)}"
        )
