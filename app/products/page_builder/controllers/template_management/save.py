"""Template save endpoint - PUT template updates."""
import asyncio
import logging
from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_db_session
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.services.auth.users_service import get_current_user

from wwai_agent_orchestration.utils.landing_page_builder.template_utils import save_template_updates
from wwai_agent_orchestration.contracts.landing_page_builder.template_update import (
    SaveTemplateRequest as OrchSaveTemplateRequest,
    SectionUpdate as OrchSectionUpdate,
)

from app.products.page_builder.controllers.template_management.shared import (
    SaveTemplateRequest,
    verify_generation_ownership_and_get_page,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _run_sync(fn, *args, **kwargs):
    """Run sync orchestration call in thread pool."""
    return asyncio.to_thread(fn, *args, **kwargs)


@router.put("/{generation_version_id}")
async def save_template(
    generation_version_id: uuid.UUID,
    request: SaveTemplateRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Save template JSON updates for sections.

    Args:
        generation_version_id: UUID of the generation
        request: Section updates with template_json_for_compiler for each section,
                 optional section_order, and optional deleted_sections

    Returns:
        Success response with updated section IDs, order status, and deleted sections
    """
    try:
        generation, page = await verify_generation_ownership_and_get_page(
            generation_version_id, db, current_user
        )

        orch_request = OrchSaveTemplateRequest(
            section_updates={
                k: OrchSectionUpdate(template_json_for_compiler=v.template_json_for_compiler)
                for k, v in request.section_updates.items()
            },
            section_order=request.section_order,
            deleted_sections=request.deleted_sections,
        )

        await _run_sync(
            save_template_updates,
            str(generation_version_id),
            orch_request,
        )

        page.last_edited_at = datetime.now(UTC).replace(tzinfo=None)
        db.add(page)
        await db.commit()

        updated_section_ids = list(request.section_updates.keys())
        order_updated = request.section_order is not None
        deleted_section_ids = request.deleted_sections or []

        final_enabled_section_ids = None
        if request.section_order is not None:
            base_ids = request.section_order
        else:
            base_ids = list(request.section_updates.keys())
        if request.deleted_sections:
            final_enabled_section_ids = [
                sid for sid in base_ids if sid not in request.deleted_sections
            ]
        elif request.section_order is not None:
            final_enabled_section_ids = request.section_order

        logger.debug(
            f"Template updated for {generation_version_id}: "
            f"sections={len(updated_section_ids)}, order_updated={order_updated}, "
            f"deleted={len(deleted_section_ids)}"
        )

        response_data = {
            "success": True,
            "message": "Template updated successfully",
            "updated_sections": updated_section_ids,
            "generation_version_id": str(generation_version_id),
        }

        if order_updated:
            response_data["order_updated"] = True
            if final_enabled_section_ids is not None:
                response_data["enabled_section_ids"] = final_enabled_section_ids

        if deleted_section_ids:
            response_data["deleted_sections"] = deleted_section_ids

        return response_data

    except ValueError as e:
        if "not found" in str(e).lower() or "no template_build_output" in str(e).lower():
            raise HTTPException(404, str(e))
        raise HTTPException(400, str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save template: {e}", exc_info=True)
        raise HTTPException(500, f"Failed to save template: {str(e)}")
