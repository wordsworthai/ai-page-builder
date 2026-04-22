"""POST /use-section-ids - Create generation using specific section IDs."""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_db_session
from app.core.db_mongo import get_mongo_database
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.products.page_builder.schemas.generation.generation import UseSectionIdsRequest, UseTemplateResponse
from app.products.page_builder.services.generation.page_generation import GenerationService
from app.shared.services.streaming.generation_redis_service import generation_redis_service
from app.shared.services.auth.users_service import get_current_user
from app.products.page_builder.controllers.generation.helpers import ensure_credits, mark_generation_failed, resolve_generation_context
from app.products.page_builder.controllers.template_management.shared import (
    page_path_to_page_type,
    resolve_parent_generation_version_id_from_page,
)
from app.shared.config.credits import WorkflowTriggerType
from app.shared.utils.user_helpers import get_business_id_from_user
from app.products.page_builder.utils.generation.workflow_input_utils import (
    prepare_workflow_from_source,
)
from app.products.page_builder.services.generation.page_generation.provisioning import (
    create_generation_version,
    resolve_or_create_target_page,
)


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/use-section-ids", response_model=UseTemplateResponse)
async def use_section_ids(
    request: UseSectionIdsRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Create a new generation using a specific list of section IDs.
    Similar to use-template but allows passing IDs directly (e.g. from curated pages).
    """
    new_generation_version_id = None
    try:
        business_id = await get_business_id_from_user(current_user, db)
        await ensure_credits(business_id, WorkflowTriggerType.USE_SECTION_IDS, db)

        _, page, website = await resolve_generation_context(
            request.source_generation_version_id, db, business_id=business_id
        )

        target_page = await resolve_or_create_target_page(
            request.page_path, request.page_title, website, page, db
        )

        mongo_db = await get_mongo_database("template_generation")

        overrides: dict = {"source_generation_version_id": str(request.source_generation_version_id)}
        if request.intent:
            overrides["website_intention"] = request.intent

        new_generation_version = await create_generation_version(
            target_page.page_id, WorkflowTriggerType.USE_SECTION_IDS.value, db
        )
        new_generation_version_id = new_generation_version.generation_version_id
        state = await prepare_workflow_from_source(
            trigger_type=WorkflowTriggerType.USE_SECTION_IDS,
            mongo_db=mongo_db,
            db=db,
            source_generation_version_id=request.source_generation_version_id,
            page_id=target_page.page_id,
            new_generation_version=new_generation_version,
            business_id=business_id,
            current_user=current_user,
            overrides=overrides,
            metadata={"section_ids": request.section_ids},
        )

        generation_redis_service.initialize_generation(
            state.new_generation_version.generation_version_id, status="pending"
        )

        gen_service = GenerationService(db, business_id)
        mock_selected = {
            "template_id": "manual_selection",
            "template_name": "Custom Selection",
            "section_mappings": [{"section_id": sid} for sid in request.section_ids],
        }

        initial_input = state.workflow_input_doc.get("initial_input") or {}
        # Use page_type from request if provided; else derive from page_path (e.g. contact-us, services)
        page_type = request.page_type or page_path_to_page_type(request.page_path)

        # Resolve parent from active homepage for this business (never from MongoDB)
        parent_generation_version_id = await resolve_parent_generation_version_id_from_page(
            target_page, db
        )

        await gen_service.run_with_provided_section_sequence(
            generation_version_id=state.new_generation_version.generation_version_id,
            business_name=initial_input.get("business_name")
            or website.website_name,
            website_intention=initial_input.get("website_intention") or "generate_leads",
            website_tone=initial_input.get("website_tone") or "professional",
            section_mapped_recommendations=[mock_selected],
            yelp_url=initial_input.get("yelp_url"),
            query=initial_input.get("query"),
            palette=initial_input.get("palette"),
            font_family=initial_input.get("font_family"),
            page_type=page_type,
            parent_generation_version_id=parent_generation_version_id,
        )

        return UseTemplateResponse(
            generation_version_id=state.new_generation_version.generation_version_id,
            status="pending",
            message="Direct section-id generation started. Poll /generations/{id}/status for progress.",
            page_id=target_page.page_id if request.page_path else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        await mark_generation_failed(db, new_generation_version_id, str(e))
        logger.error(f"Failed to start section-ids generation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start section-ids generation: {str(e)}",
        )
