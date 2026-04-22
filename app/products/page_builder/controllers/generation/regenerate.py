"""POST /{id}/regenerate-color-theme, POST /{id}/regenerate-content."""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_db_session
from app.core.db_mongo import get_mongo_database
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.products.page_builder.schemas.generation.generation import (
    GeneratePageResponse,
    RegenerateColorThemeRequest,
    RegenerateContentRequest,
    RegenerateSectionRequest,
)
from app.products.page_builder.services.generation.page_generation import GenerationService
from app.shared.services.streaming.generation_redis_service import generation_redis_service
from app.products.page_builder.utils.generation.workflow_input_utils import (
    WorkflowTriggerType,
    prepare_workflow_from_source,
)
from app.shared.services.auth.users_service import get_current_user
from app.products.page_builder.controllers.generation.helpers import (
    ensure_credits,
    mark_generation_failed,
    resolve_generation_context,
    require_completed_generation,
)
from app.shared.utils.user_helpers import get_business_id_from_user
from app.products.page_builder.services.generation.page_generation.provisioning import create_generation_version


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/{generation_version_id}/regenerate-color-theme",
    response_model=GeneratePageResponse,
)
async def regenerate_color_theme(
    generation_version_id: uuid.UUID,
    request: RegenerateColorThemeRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Regenerate color theme using AutopopOnlyWorkflow.
    Creates new GenerationVersion, runs autopop-only with new palette/font.
    """
    new_generation_version_id = None
    try:
        business_id = await get_business_id_from_user(current_user, db)
        await ensure_credits(business_id, WorkflowTriggerType.REGENERATE_COLOR_THEME, db)
        source_generation, page, website = await resolve_generation_context(
            generation_version_id, db, business_id=business_id
        )

        require_completed_generation(
            source_generation, "regenerate color theme"
        )

        mongo_db = await get_mongo_database("template_generation")

        new_generation_version = await create_generation_version(
            page.page_id, WorkflowTriggerType.REGENERATE_COLOR_THEME.value, db
        )
        new_generation_version_id = new_generation_version.generation_version_id
        state = await prepare_workflow_from_source(
            trigger_type=WorkflowTriggerType.REGENERATE_COLOR_THEME,
            mongo_db=mongo_db,
            db=db,
            source_generation_version_id=generation_version_id,
            page_id=page.page_id,
            new_generation_version=new_generation_version,
            business_id=business_id,
            current_user=current_user,
            overrides={
                "source_generation_version_id": str(generation_version_id),
                "color_palette_id": request.palette_id or "",
                "palette_id": request.palette_id or "",
                "palette": request.palette or {},
                "font_family": request.font_family or "",
            },
        )

        generation_redis_service.initialize_generation(
            state.new_generation_version.generation_version_id, status="pending"
        )

        gen_service = GenerationService(db, business_id)
        await gen_service.run_autopop_only_workflow(
            source_generation_version_id=generation_version_id,
            new_generation_version_id=state.new_generation_version.generation_version_id,
            palette=request.palette,
            font_family=request.font_family,
        )

        return GeneratePageResponse(
            generation_version_id=state.new_generation_version.generation_version_id,
            page_id=page.page_id,
            website_id=website.website_id,
            subdomain=website.subdomain,
            status="pending",
            message="Color theme regeneration started. Poll /generations/{id}/status for progress.",
        )

    except HTTPException:
        raise
    except Exception as e:
        await mark_generation_failed(db, new_generation_version_id, str(e))
        logger.error(
            f"Failed to regenerate color theme: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start color theme regeneration: {str(e)}",
        )


@router.post(
    "/{generation_version_id}/regenerate-content",
    response_model=GeneratePageResponse,
)
async def regenerate_content(
    generation_version_id: uuid.UUID,
    request: RegenerateContentRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Regenerate content using AutopopOnlyWorkflow with regenerate_mode="text".
    Creates new GenerationVersion, runs autopop-only for text only.
    """
    new_generation_version_id = None
    try:
        # Prepare generation preflight and get business ID, Also validate credits.
        business_id = await get_business_id_from_user(current_user, db)
        await ensure_credits(business_id, WorkflowTriggerType.REGENERATE_CONTENT, db)
        source_generation, page, website = await resolve_generation_context(
            generation_version_id, db, business_id=business_id
        )

        require_completed_generation(
            source_generation, "regenerate content"
        )

        mongo_db = await get_mongo_database("template_generation")

        new_generation_version = await create_generation_version(
            page.page_id, WorkflowTriggerType.REGENERATE_CONTENT.value, db
        )
        new_generation_version_id = new_generation_version.generation_version_id
        state = await prepare_workflow_from_source(
            trigger_type=WorkflowTriggerType.REGENERATE_CONTENT,
            mongo_db=mongo_db,
            db=db,
            source_generation_version_id=generation_version_id,
            page_id=page.page_id,
            new_generation_version=new_generation_version,
            business_id=business_id,
            current_user=current_user,
            overrides={"source_generation_version_id": str(generation_version_id)},
        )

        generation_redis_service.initialize_generation(
            state.new_generation_version.generation_version_id, status="pending"
        )

        gen_service = GenerationService(db, business_id)
        initial = state.workflow_input_doc.get("initial_input") or {}
        await gen_service.run_autopop_only_workflow(
            source_generation_version_id=generation_version_id,
            new_generation_version_id=state.new_generation_version.generation_version_id,
            palette=initial.get("palette"),
            font_family=initial.get("font_family"),
            regenerate_mode="text",
        )

        return GeneratePageResponse(
            generation_version_id=state.new_generation_version.generation_version_id,
            page_id=page.page_id,
            website_id=website.website_id,
            subdomain=website.subdomain,
            status="pending",
            message="Content regeneration started. Poll /generations/{id}/status for progress.",
        )

    except HTTPException:
        raise
    except Exception as e:
        await mark_generation_failed(db, new_generation_version_id, str(e))
        logger.error(
            f"Failed to regenerate content: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start content regeneration: {str(e)}",
        )


@router.post(
    "/{generation_version_id}/regenerate-section",
    response_model=GeneratePageResponse,
)
async def regenerate_section(
    generation_version_id: uuid.UUID,
    request: RegenerateSectionRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Regenerate content for a single section using RegenerateSection workflow.
    Creates new GenerationVersion, triggers regenerate_section workflow.
    No redirect - stay on page, show overlay, poll status.
    """
    new_generation_version_id = None
    try:
        business_id = await get_business_id_from_user(current_user, db)
        await ensure_credits(business_id, WorkflowTriggerType.SECTION_REGENERATION, db)
        source_generation, page, website = await resolve_generation_context(
            generation_version_id, db, business_id=business_id
        )

        require_completed_generation(
            source_generation, "regenerate section"
        )

        mongo_db = await get_mongo_database("template_generation")

        new_generation_version = await create_generation_version(
            page.page_id, WorkflowTriggerType.SECTION_REGENERATION.value, db
        )
        new_generation_version_id = new_generation_version.generation_version_id
        state = await prepare_workflow_from_source(
            trigger_type=WorkflowTriggerType.SECTION_REGENERATION,
            mongo_db=mongo_db,
            db=db,
            source_generation_version_id=generation_version_id,
            page_id=page.page_id,
            new_generation_version=new_generation_version,
            business_id=business_id,
            current_user=current_user,
            overrides={"source_generation_version_id": str(generation_version_id)},
            metadata={
                "section_id": request.section_id,
                "section_index": request.section_index,
            },
        )

        generation_redis_service.initialize_generation(
            state.new_generation_version.generation_version_id, status="pending"
        )

        gen_service = GenerationService(db, business_id)
        await gen_service.run_regenerate_section_workflow(
            source_generation_version_id=generation_version_id,
            new_generation_version_id=state.new_generation_version.generation_version_id,
            section_id=request.section_id,
            section_index=request.section_index,
        )

        return GeneratePageResponse(
            generation_version_id=state.new_generation_version.generation_version_id,
            page_id=page.page_id,
            website_id=website.website_id,
            subdomain=website.subdomain,
            status="pending",
            message="Section regeneration started. Poll /generations/{id}/status for progress.",
        )

    except HTTPException:
        raise
    except Exception as e:
        await mark_generation_failed(db, new_generation_version_id, str(e))
        logger.error(
            f"Failed to regenerate section: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start section regeneration: {str(e)}",
        )
