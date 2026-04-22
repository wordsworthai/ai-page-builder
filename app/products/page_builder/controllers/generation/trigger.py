"""POST /trigger - Trigger AI page generation."""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_db_session
from app.core.db_mongo import get_mongo_database
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.products.page_builder.schemas.generation.generation import GeneratePageRequest, GeneratePageResponse
from app.products.page_builder.controllers.generation.helpers import ensure_credits, mark_generation_failed
from app.shared.config.credits import WorkflowTriggerType
from app.shared.utils.user_helpers import get_business_id_from_user
from app.products.page_builder.services.generation.page_generation import GenerationService
from app.shared.services.streaming.generation_redis_service import generation_redis_service
from app.products.page_builder.utils.generation.workflow_input_utils import prepare_workflow_for_create_site
from app.shared.services.auth.users_service import get_current_user


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/trigger", response_model=GeneratePageResponse)
async def trigger_page_generation(
    request: GeneratePageRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Trigger AI page generation."""
    generation_version_id = None
    try:
        business_id = await get_business_id_from_user(current_user, db)
        await ensure_credits(business_id, WorkflowTriggerType.CREATE_SITE, db)
        gen_service = GenerationService(db, business_id)

        assets = await gen_service.provision_assets(
            business_name=request.business_name,
            website_intention=request.website_intention,
        )

        generation_version_id = assets["generation_version_id"]
        logger.info(f"Generation triggered: {generation_version_id}")

        mongo_db = await get_mongo_database("template_generation")
        state = await prepare_workflow_for_create_site(
            mongo_db=mongo_db,
            generation_version_id=generation_version_id,
            page_id=assets["page_id"],
            business_id=business_id,
            current_user=current_user,
            overrides={
                "business_name": request.business_name,
                "website_intention": request.website_intention,
                "website_tone": request.website_tone,
                "color_palette_id": request.color_palette_id or "",
                "palette_id": request.color_palette_id or "",
                "palette": request.palette or {},
                "font_family": request.font_family or "",
                "google_places_data": request.google_places_data,
                "yelp_url": request.yelp_url,
                "query": request.query,
            },
        )

        generation_redis_service.initialize_generation(
            state.generation_version_id, status="pending"
        )

        await gen_service.run_landing_page_workflow(
            generation_version_id=state.generation_version_id,
            business_name=request.business_name,
            website_intention=request.website_intention,
            website_tone=request.website_tone,
            yelp_url=request.yelp_url,
            query=request.query,
            palette=request.palette,
            font_family=request.font_family,
        )

        return GeneratePageResponse(
            generation_version_id=generation_version_id,
            page_id=assets["page_id"],
            website_id=assets["website_id"],
            subdomain=assets["subdomain"],
            status="pending",
            message="Generation started. Poll /generations/{id}/status for progress.",
        )

    except HTTPException:
        raise
    except Exception as e:
        await mark_generation_failed(db, generation_version_id, str(e))
        logger.error(f"Failed to trigger generation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to start generation: {str(e)}"
        )
