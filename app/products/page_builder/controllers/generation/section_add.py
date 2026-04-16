"""POST /{id}/add-section-in-place - Add or replace section in-place (updates 3 DBs with lorem)."""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_db_session
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.products.page_builder.schemas.generation.generation import AddSectionInPlaceRequest
from app.shared.services.auth.users_service import get_current_user
from app.products.page_builder.controllers.generation.helpers import resolve_generation_context
from app.shared.utils.user_helpers import get_business_id_from_user


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/{generation_version_id}/add-section-in-place")
async def add_section_in_place(
    generation_version_id: uuid.UUID,
    request: AddSectionInPlaceRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Add or replace a section in a generation's 3 DBs in place (no new generation).
    Updates generation_template_sections, autopopulation_snapshots, generated_templates_with_values with lorem content.
    """
    if request.mode == "replace" and request.replace_index is None:
        raise HTTPException(
            status_code=422,
            detail="replace_index is required when mode='replace'",
        )

    business_id = await get_business_id_from_user(current_user, db)
    await resolve_generation_context(
        generation_version_id, db, business_id=business_id
    )

    try:
        from wwai_agent_orchestration.utils.landing_page_builder.section_add_utils import (
            add_section_in_place as _add_section_in_place,
        )

        await _add_section_in_place(
            generation_version_id=str(generation_version_id),
            section_id=request.section_id,
            insert_index=request.insert_index,
            mode=request.mode,
            replace_index=request.replace_index,
        )
        return {"success": True, "message": "Section added in place."}
    except Exception as e:
        logger.error(
            f"Failed to add section in place: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add section in place: {str(e)}",
        )
