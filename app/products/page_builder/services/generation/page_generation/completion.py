"""Handle workflow completion and post-workflow template processing."""
import logging
import uuid
from datetime import datetime, UTC
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.shared.config.credits import get_credit_operation_for_scope, get_operation_display_label
from app.products.page_builder.models import GenerationVersion, Website, WebsitePage
from app.shared.services.streaming.generation_redis_service import generation_redis_service

from app.products.page_builder.services.generation.page_generation.credits import (
    deduct_generation_credits_with_error_handling,
)

logger = logging.getLogger(__name__)


def _credit_description_with_page(
    generation: GenerationVersion,
    page: WebsitePage,
) -> str:
    """Build credit transaction description with operation label and page context."""
    operation = get_credit_operation_for_scope(generation.generation_scope)
    base_label = get_operation_display_label(operation)
    path_stripped = (page.page_path or "").strip("/")
    page_display = "homepage" if path_stripped == "" else path_stripped
    return f"{base_label} (page: {page_display})"


async def handle_completion(
    db: AsyncSession,
    generation_version_id: uuid.UUID,
    status: str,
    tokens_used: Optional[int] = None,
    estimated_cost_usd: Optional[float] = None,
    error_message: Optional[str] = None,
) -> None:
    """Handle workflow completion (success or failure). Updates generation, runs compile + credit deduction on success."""
    generation = await db.get(GenerationVersion, generation_version_id)

    if not generation:
        raise HTTPException(
            status_code=404,
            detail=f"Generation {generation_version_id} not found",
        )

    page = await db.get(WebsitePage, generation.entity_id)
    if not page:
        raise HTTPException(404, "Page not found")

    website = await db.get(Website, page.website_id)
    if not website:
        raise HTTPException(404, "Website not found")

    business_id = website.business_id
    is_load_test = False
    if config.load_test_business_id:
        try:
            load_test_bid = uuid.UUID(config.load_test_business_id)
            is_load_test = business_id == load_test_bid
        except (ValueError, TypeError):
            pass

    generation.status = status
    generation.completed_at = datetime.now(UTC).replace(tzinfo=None)
    generation.tokens_used = tokens_used
    generation.estimated_cost_usd = estimated_cost_usd
    generation.error_message = error_message

    db.add(generation)

    if status == "completed":
        try:
            if not is_load_test:
                description_with_page = _credit_description_with_page(generation, page)
                await deduct_generation_credits_with_error_handling(
                    db,
                    business_id,
                    generation,
                    generation_version_id,
                    description_override=description_with_page,
                )
            page.current_generation_id = generation_version_id
            db.add(page)

            logger.info(
                f"Generation {generation_version_id} completed successfully"
            )
        except Exception as compilation_error:
            logger.error(
                f"Template compilation failed: {compilation_error}",
                exc_info=True,
            )
            generation.status = "failed"
            generation.error_message = (
                f"Template compilation failed: {str(compilation_error)}"
            )
            db.add(generation)
            generation_redis_service.update_status(
                generation_version_id, "failed"
            )
            generation_redis_service.set_error(
                generation_version_id, str(compilation_error)
            )

    await db.commit()
    await db.refresh(generation)