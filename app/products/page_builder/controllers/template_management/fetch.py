"""Template fetch endpoints - GET compiled template and status."""
import asyncio
import logging
import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_db_session
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.services.auth.users_service import get_current_user
from app.products.page_builder.models import GenerationVersion

from app.products.page_builder.schemas.generation.template_build_output import TemplateWithPageInfo

from wwai_agent_orchestration.utils.landing_page_builder.template_utils import (
    compile_and_get_ipsum_lorem_template_for_generation_version_id,
    get_template_for_generation_version_id_from_db,
)
from wwai_agent_orchestration.utils.landing_page_builder.template import template_db_service

from app.products.page_builder.controllers.template_management.shared import (
    verify_generation_ownership_and_get_page,
    page_path_to_page_type,
    resolve_parent_generation_version_id_from_page,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _run_sync(coro_fn, *args, **kwargs):
    """Run sync orchestration call in thread pool to avoid blocking."""
    return asyncio.to_thread(coro_fn, *args, **kwargs)


@router.get("/{generation_version_id}/status")
async def get_template_status(
    generation_version_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Check if template has been compiled (lightweight check).

    Returns:
        {
            "compiled": bool,
            "generation_status": str,
            "section_count": int
        }
    """
    generation = await db.get(GenerationVersion, generation_version_id)
    if not generation:
        raise HTTPException(404, "Generation not found")

    template_doc = await _run_sync(
        template_db_service.get_compiled_template,
        str(generation_version_id),
    )

    section_count = None
    if template_doc:
        tbo = template_doc.get("template_build_output", {})
        if isinstance(tbo, dict):
            section_count = len(tbo.get("enabled_section_ids", []))
        else:
            section_count = getattr(tbo, "enabled_section_ids", None)
            if section_count is not None:
                section_count = len(section_count)

    return {
        "compiled": bool(template_doc),
        "generation_status": generation.status,
        "section_count": section_count,
    }


@router.get("/{generation_version_id}", response_model=TemplateWithPageInfo)
async def get_compiled_template(
    generation_version_id: uuid.UUID,
    template_json_type: Optional[str] = Query(
        None,
        description="Type of template JSON to use (e.g., 'real_population' or 'ipsum_lorem')",
    ),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Get compiled template JSON for Puck editor.

    Args:
        generation_version_id: UUID of the generation
        template_json_type: Type of template JSON ("real_population" = from DB, "ipsum_lorem" = compile)

    Returns:
        TemplateBuildOutput (model_dump) - template JSON for editor
    """
    endpoint_start = time.time()

    try:
        db_start = time.time()
        generation, page = await verify_generation_ownership_and_get_page(
            generation_version_id,
            db,
            current_user,
        )
        generation_status = generation.status or "completed"
        generation_error_message = generation.error_message or ""

        # Always resolve parent and page_type from DB—never from MongoDB doc/sections_doc
        parent_gvid = await resolve_parent_generation_version_id_from_page(page, db)
        page_type = page_path_to_page_type(page.page_path)

        db_time = time.time() - db_start

        if db_time > 0.05:
            logger.warning(
                f"Slow DB query (get_compiled_template) for {generation_version_id}: {db_time*1000:.2f}ms"
            )

        gvid_str = str(generation_version_id)
        effective_type = template_json_type or "real_population"

        orch_start = time.time()

        if effective_type == "real_population":
            # Always get from DB - never compile
            doc = await _run_sync(
                template_db_service.get_compiled_template,
                gvid_str,
            )
            if not doc:
                if generation_status == "failed":
                    raise HTTPException(
                        400,
                        f"Generation failed: {generation_error_message or 'Unknown error'}",
                    )
                if generation_status == "completed":
                    raise HTTPException(
                        500,
                        "Template not found. Compilation may have failed.",
                    )
                raise HTTPException(
                    202,
                    "Template is still being compiled.",
                )
            result = await _run_sync(
                get_template_for_generation_version_id_from_db,
                gvid_str,
                page_type,
                parent_gvid,
            )
        else:
            # ipsum_lorem: always compile - never look in DB
            result = await compile_and_get_ipsum_lorem_template_for_generation_version_id(
                generation_version_id=gvid_str,
                parent_generation_version_id=parent_gvid,
            )

        orch_time = time.time() - orch_start
        total_time = time.time() - endpoint_start

        if total_time > 0.1:
            logger.warning(
                f"Slow template fetch for {generation_version_id}: "
                f"total={total_time*1000:.2f}ms, db={db_time*1000:.2f}ms, orch={orch_time*1000:.2f}ms"
            )

        return TemplateWithPageInfo.model_validate(result.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        total_time = time.time() - endpoint_start
        logger.error(
            f"Failed to fetch template for {generation_version_id} "
            f"(took {total_time*1000:.2f}ms): {e}",
            exc_info=True,
        )
        raise HTTPException(500, f"Failed to fetch template: {str(e)}")
