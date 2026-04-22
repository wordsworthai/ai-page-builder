"""
Shared validation and persistence helpers for generation endpoints.
No FastAPI dependencies - pure async helpers.
"""
import logging
import uuid
from typing import Any, Dict, Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.db_mongo import get_mongo_database
from app.products.page_builder.models import GenerationVersion, Website, WebsitePage
from app.shared.config.credits import WorkflowTriggerType, get_credit_cost
from app.shared.services.payments.credit_service import CreditService


logger = logging.getLogger(__name__)


async def resolve_generation_context(
    generation_version_id: uuid.UUID,
    db: AsyncSession,
    business_id: Optional[uuid.UUID] = None,
):
    """
    Load generation, page, website. Optionally verify the generation belongs to the given business.

    When business_id is provided: returns (generation, page, website) or raises 404/403.
    When business_id is None (e.g. internal endpoints): returns (generation, page, website) or raises 404.
    """
    generation = await db.get(GenerationVersion, generation_version_id)
    if not generation:
        raise HTTPException(
            status_code=404,
            detail=f"Generation {generation_version_id} not found",
        )
    page = await db.get(WebsitePage, generation.entity_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    website = await db.get(Website, page.website_id)
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    if business_id is not None and str(website.business_id) != str(business_id):
        raise HTTPException(status_code=403, detail="Permission denied")
    return generation, page, website


def require_completed_generation(generation: GenerationVersion, action_name: str) -> None:
    """Raises 409 if generation status is not 'completed'."""
    if generation.status != "completed":
        raise HTTPException(
            status_code=409,
            detail=f"Cannot {action_name} from generation with status '{generation.status}'. Generation must be completed.",
        )


async def require_workflow_input(
    generation_version_id: uuid.UUID,
    mongo_db=None,
    detail: Optional[str] = None,
):
    """
    Load workflow_input document for the generation. Returns the doc or raises 409.
    If mongo_db is not provided, fetches it from get_mongo_database('template_generation').
    Pass detail to override the default error message (e.g. for retry endpoint).
    """
    if mongo_db is None:
        mongo_db = await get_mongo_database("template_generation")
    workflow_doc = await mongo_db["workflow_input"].find_one(
        {"generation_version_id": str(generation_version_id)}
    )
    if not workflow_doc:
        msg = (
            detail
            if detail is not None
            else (
                f"Source generation {generation_version_id} does not have workflow data. "
                "Partial autopop requires a generation that was created through the full workflow. "
                "The generation's workflow checkpoints may have expired or been cleared."
            )
        )
        raise HTTPException(status_code=409, detail=msg)
    return workflow_doc


async def require_credits(
    business_id: uuid.UUID,
    required: int,
    db: AsyncSession,
) -> None:
    """Check business has at least `required` credits; raises 403 if insufficient."""
    credit_service = CreditService(db)
    has_credits = await credit_service.has_sufficient_credits(
        business_id,
        required=required,
    )
    if not has_credits:
        balance = await credit_service.get_balance(business_id)
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient credits. Have {balance}, need {required}.",
        )


async def ensure_credits(
    business_id: uuid.UUID,
    operation: WorkflowTriggerType,
    db: AsyncSession,
) -> None:
    """Check business has sufficient credits for the given operation. Raises 403 if insufficient."""
    required = get_credit_cost(operation)
    await require_credits(business_id, required, db)


async def mark_generation_failed(
    db: AsyncSession,
    generation_version_id: Optional[uuid.UUID],
    error: str,
) -> None:
    """
    Mark a committed GenerationVersion as failed.
    Called in except blocks after a workflow launch failure to prevent
    orphaned pending rows from accumulating on retries.
    """
    if not generation_version_id:
        return
    try:
        result = await db.execute(
            select(GenerationVersion).where(
                GenerationVersion.generation_version_id == generation_version_id,
                GenerationVersion.status == "pending",
            )
        )
        gen = result.scalar_one_or_none()
        if gen:
            gen.status = "failed"
            gen.error_message = error[:500]
            await db.commit()
    except Exception:
        logger.warning(
            f"Could not mark generation {generation_version_id} as failed after error",
            exc_info=True,
        )


async def persist_workflow_input(
    mongo_db,
    doc: Dict[str, Any],
    generation_version_id_str: str,
) -> None:
    """
    Insert workflow_input document. On failure logs and does not raise (callers do not block generation).
    generation_version_id_str is used only for logging.
    """
    try:
        await mongo_db["workflow_input"].insert_one(doc)
    except Exception as mongo_error:
        logger.error(
            f"Failed to persist workflow_input for {generation_version_id_str}: {mongo_error}",
            exc_info=True,
        )