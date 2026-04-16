"""POST /{generation_version_id}/retry - Retry a failed generation."""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_db_session
from app.core.db_mongo import get_mongo_database
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.products.page_builder.services.generation.page_generation import GenerationService
from app.shared.services.streaming.generation_redis_service import generation_redis_service
from app.shared.utils.user_helpers import get_business_id_from_user
from app.shared.services.auth.users_service import get_current_user
from app.products.page_builder.controllers.generation.helpers import (
    resolve_generation_context,
    require_workflow_input,
)
from app.products.page_builder.controllers.template_management.shared import (
    page_path_to_page_type,
    resolve_parent_generation_version_id_from_page,
)


router = APIRouter()
logger = logging.getLogger(__name__)

# Workflow names stored in MongoDB workflow_input. Used for retry dispatch.
WORKFLOW_LANDING_PAGE = "landing_page_recommendation"
WORKFLOW_USE_SECTION_IDS = "use-section-ids"
WORKFLOW_REGENERATE_COLOR_THEME = "regenerate-color-theme"
WORKFLOW_REGENERATE_CONTENT = "regenerate-content"
WORKFLOW_SECTION_REGENERATION = "section_regeneration"


@router.post("/{generation_version_id}/retry")
async def retry_generation(
    generation_version_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Retry a failed generation by resuming from its last checkpoint.
    Dispatches to the correct workflow based on workflow_name stored in Mongo.
    Supports: create-site, use-section-ids, regenerate-color-theme, regenerate-content, section_regeneration.
    """
    try:
        business_id = await get_business_id_from_user(current_user, db)
        generation, page, website = await resolve_generation_context(
            generation_version_id, db, business_id=business_id
        )

        if generation.status == "processing":
            raise HTTPException(
                status_code=409, detail="Generation is already processing"
            )
        if generation.status == "completed":
            raise HTTPException(
                status_code=409, detail="Generation is already completed"
            )

        mongo_db = await get_mongo_database("template_generation")
        workflow_doc = await require_workflow_input(
            generation_version_id,
            mongo_db,
            detail="Original workflow inputs not found for this generation. Please start a new generation.",
        )
        workflow_name = workflow_doc.get("workflow_name") or ""
        initial_input = workflow_doc.get("initial_input") or {}
        metadata = workflow_doc.get("metadata") or {}
        triggered_by = workflow_doc.get("triggered_by") or {}

        generation_redis_service.reset_for_retry(generation_version_id)

        generation.status = "processing"
        generation.error_message = None
        db.add(generation)
        await db.commit()
        await db.refresh(generation)

        gen_service = GenerationService(db, business_id)

        if workflow_name == WORKFLOW_LANDING_PAGE:
            await gen_service.run_landing_page_workflow(
                generation_version_id=generation_version_id,
                business_name=initial_input.get("business_name")
                or website.website_name,
                website_intention=initial_input.get("website_intention")
                or "generate_leads",
                website_tone=initial_input.get("website_tone") or "professional",
                yelp_url=initial_input.get("yelp_url"),
                query=initial_input.get("query"),
                palette=initial_input.get("palette"),
                font_family=initial_input.get("font_family"),
            )
        elif workflow_name == WORKFLOW_USE_SECTION_IDS:
            section_ids = metadata.get("section_ids") or []
            if not section_ids:
                raise HTTPException(
                    status_code=409,
                    detail="Workflow input missing section_ids. Cannot retry use-section-ids.",
                )
            section_mapped_recommendations = [
                {
                    "template_id": "manual_selection",
                    "template_name": "Custom Selection",
                    "section_mappings": [{"section_id": sid} for sid in section_ids],
                }
            ]
            page_type = metadata.get("page_type") or page_path_to_page_type(
                page.page_path
            )
            parent_generation_version_id = (
                await resolve_parent_generation_version_id_from_page(page, db)
            )
            await gen_service.run_with_provided_section_sequence(
                generation_version_id=generation_version_id,
                business_name=initial_input.get("business_name")
                or website.website_name,
                website_intention=initial_input.get("website_intention")
                or "generate_leads",
                website_tone=initial_input.get("website_tone") or "professional",
                section_mapped_recommendations=section_mapped_recommendations,
                yelp_url=initial_input.get("yelp_url"),
                query=initial_input.get("query"),
                palette=initial_input.get("palette"),
                font_family=initial_input.get("font_family"),
                page_type=page_type,
                parent_generation_version_id=parent_generation_version_id,
            )
        elif workflow_name == WORKFLOW_REGENERATE_COLOR_THEME:
            source_id_str = triggered_by.get("source_generation_version_id")
            if not source_id_str:
                raise HTTPException(
                    status_code=409,
                    detail="Workflow input missing source_generation_version_id. Cannot retry regenerate-color-theme.",
                )
            source_generation_version_id = uuid.UUID(source_id_str)
            await gen_service.run_autopop_only_workflow(
                source_generation_version_id=source_generation_version_id,
                new_generation_version_id=generation_version_id,
                palette=initial_input.get("palette"),
                font_family=initial_input.get("font_family"),
                regenerate_mode="styles",
            )
        elif workflow_name == WORKFLOW_REGENERATE_CONTENT:
            source_id_str = triggered_by.get("source_generation_version_id")
            if not source_id_str:
                raise HTTPException(
                    status_code=409,
                    detail="Workflow input missing source_generation_version_id. Cannot retry regenerate-content.",
                )
            source_generation_version_id = uuid.UUID(source_id_str)
            await gen_service.run_autopop_only_workflow(
                source_generation_version_id=source_generation_version_id,
                new_generation_version_id=generation_version_id,
                palette=initial_input.get("palette"),
                font_family=initial_input.get("font_family"),
                regenerate_mode="text",
            )
        elif workflow_name == WORKFLOW_SECTION_REGENERATION:
            source_id_str = triggered_by.get("source_generation_version_id")
            section_id = metadata.get("section_id")
            section_index = metadata.get("section_index")
            if not source_id_str:
                raise HTTPException(
                    status_code=409,
                    detail="Workflow input missing source_generation_version_id. Cannot retry section regeneration.",
                )
            if section_id is None:
                raise HTTPException(
                    status_code=409,
                    detail="Workflow input missing metadata.section_id. Cannot retry section regeneration.",
                )
            if section_index is None:
                raise HTTPException(
                    status_code=409,
                    detail="Workflow input missing metadata.section_index. Cannot retry section regeneration.",
                )
            source_generation_version_id = uuid.UUID(source_id_str)
            await gen_service.run_regenerate_section_workflow(
                source_generation_version_id=source_generation_version_id,
                new_generation_version_id=generation_version_id,
                section_id=section_id,
                section_index=int(section_index),
            )
        else:
            raise HTTPException(
                status_code=409,
                detail=f"Retry not supported for workflow type '{workflow_name}'. Please start a new generation.",
            )

        return {
            "generation_version_id": str(generation_version_id),
            "status": "processing",
            "message": "Retry started. Workflow will resume from the last saved state.",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to retry generation {generation_version_id}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retry generation: {str(e)}",
        )
