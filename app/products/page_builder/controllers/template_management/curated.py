"""GET /curated-pages - List curated pages via orchestration."""
import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException

from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.services.auth.users_service import get_current_user
from wwai_agent_orchestration.contracts.landing_page_builder.curated_options import (
    CuratedPagesResponse,
)
from wwai_agent_orchestration.utils.landing_page_builder.template_utils import (
    get_curated_pages,
)


router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/curated-pages", response_model=CuratedPagesResponse)
async def list_curated_pages(
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """List all available curated pages from MongoDB curated_pages collection (via orchestration)."""
    try:
        result = await asyncio.to_thread(get_curated_pages)
        return result
    except Exception as e:
        logger.error(
            f"Failed to fetch curated pages: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch curated pages: {str(e)}",
        )
