"""Credit validation and deduction for generation."""
import logging
import uuid
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.products.page_builder.models import GenerationVersion
from app.shared.config.credits import WorkflowTriggerType, get_credit_cost, get_credit_operation_for_scope
from app.shared.services.payments.credit_service import CreditService, InsufficientCreditsError
from app.shared.services.streaming.generation_redis_service import generation_redis_service

logger = logging.getLogger(__name__)


async def validate_credits(db: AsyncSession, business_id: uuid.UUID) -> None:
    """Validate that business has sufficient credits for generation. Raises HTTPException 403 if not."""
    credit_service = CreditService(db)
    required_credits = get_credit_cost(WorkflowTriggerType.CREATE_SITE)

    has_credits = await credit_service.has_sufficient_credits(
        business_id,
        required=required_credits,
    )

    if not has_credits:
        balance = await credit_service.get_balance(business_id)
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient credits. Have {balance}, need {required_credits}.",
        )


async def deduct_credits(
    db: AsyncSession,
    business_id: uuid.UUID,
    generation_version_id: uuid.UUID,
) -> None:
    """Deduct credits for a full page generation. Raises HTTPException 403 on insufficient credits."""
    credit_service = CreditService(db)
    try:
        await credit_service.deduct_credits_for_operation(
            business_id=business_id,
            operation=WorkflowTriggerType.CREATE_SITE,
            reference_id=str(generation_version_id),
        )
        await db.commit()
    except InsufficientCreditsError as e:
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient credits. Have {e.available}, need {e.required}.",
        )


async def deduct_generation_credits_with_error_handling(
    db: AsyncSession,
    business_id: uuid.UUID,
    generation: GenerationVersion,
    generation_version_id: uuid.UUID,
    description_override: Optional[str] = None,
) -> None:
    """
    Deduct credits for a generation based on its scope, with proper error handling.
    Resolves WorkflowTriggerType from generation_scope, then deducts. Updates generation
    status and Redis on InsufficientCreditsError. Optional description_override is used
    for the transaction record (e.g. with page context).
    """
    credit_service = CreditService(db)
    operation = get_credit_operation_for_scope(generation.generation_scope)

    try:
        await credit_service.deduct_credits_for_operation(
            business_id=business_id,
            operation=operation,
            reference_id=str(generation_version_id),
            description_override=description_override,
        )
        await db.commit()
        logger.info(
            f"Deducted credits for generation {generation_version_id} ({operation.value})"
        )
    except InsufficientCreditsError as e:
        logger.error(
            f"Insufficient credits for generation {generation_version_id}: {e}"
        )
        generation.status = "failed"
        generation.error_message = (
            f"Insufficient credits. Have {e.available}, need {e.required}."
        )
        db.add(generation)
        generation_redis_service.update_status(generation_version_id, "failed")
        generation_redis_service.set_error(
            generation_version_id, generation.error_message
        )
        raise
