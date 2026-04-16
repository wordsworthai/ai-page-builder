"""GET /browse - Browse template options for the business via orchestration."""
import asyncio
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_db_session
from app.core.db_mongo import get_mongo_database
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.products.page_builder.schemas.generation.generation import GenerationTemplatesResponse, TemplateOption
from app.shared.services.auth.users_service import get_current_user
from app.shared.utils.user_helpers import get_business_id_from_user
from app.products.page_builder.controllers.generation.helpers import resolve_generation_context
from wwai_agent_orchestration.utils.landing_page_builder.template_utils import (
    get_template_options_for_editor,
)


router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/browse", response_model=GenerationTemplatesResponse)
async def get_generation_templates(
    generation_version_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    List template options for the business based on trade classification (via orchestration).
    Optional generation_version_id marks the current selection.
    """
    business_id = await get_business_id_from_user(current_user, db)

    current_section_ids = []
    if generation_version_id:
        try:
            await resolve_generation_context(
                generation_version_id, db, business_id=business_id
            )
            mongo_db = await get_mongo_database("template_generation")
            section_ids_doc = await mongo_db["generation_section_ids"].find_one(
                {"generation_version_id": str(generation_version_id)}
            )
            current_section_ids = (
                (section_ids_doc or {}).get("section_ids") or []
            )
        except HTTPException:
            pass

    try:
        orch_response = await asyncio.to_thread(
            get_template_options_for_editor,
            business_id=str(business_id),
            current_section_ids=current_section_ids or None,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to fetch template options: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch template options: {str(e)}",
        )

    templates = [
        TemplateOption.model_validate(opt.model_dump())
        for opt in orch_response.options
    ]
    return GenerationTemplatesResponse(templates=templates)
