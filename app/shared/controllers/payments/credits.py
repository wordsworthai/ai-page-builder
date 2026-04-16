"""
Credits Controller - API endpoints for credit management.

Endpoints:
- GET /api/credits/balance - Get current credit balance
- GET /api/credits/transactions - Get transaction history
- GET /api/credits/info - Get complete credit info with costs
- POST /api/credits/purchase - Purchase credit pack (BASIC+ only)
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_async_db_session
from app.shared.models import BusinessUser
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.schemas.payments.credits import (
    CreditsBalanceResponse,
    CreditTransactionResponse,
    CreditTransactionListResponse,
    CreditsInfoResponse,
    PurchaseCreditsRequest,
)
from app.shared.services.auth.users_service import get_current_user
from app.shared.services.payments.credit_service import CreditService
from app.shared.services.payments.upgrade_service import UpgradeService
from app.shared.config.credits import WorkflowTriggerType, get_credit_cost

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/credits", tags=["credits"])


async def _get_user_primary_business_id(db: AsyncSession, user_id) -> Optional[str]:
    """Get the primary (first) business ID for a user."""
    stmt = select(BusinessUser.business_id).where(BusinessUser.user_id == user_id)
    result = await db.execute(stmt)
    row = result.first()
    return row[0] if row else None


@router.get("/balance", response_model=CreditsBalanceResponse)
async def get_credits_balance(
    current_user: CurrentUserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Get current credit balance for the user's business.
    
    Returns:
        CreditsBalanceResponse with current balance and plan info
    """
    business_id = await _get_user_primary_business_id(db, current_user.user_id)
    
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business found for user"
        )
    
    credit_service = CreditService(db)
    credits_record = await credit_service.get_credits_record(business_id)
    
    if not credits_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credits record not found"
        )
    
    return CreditsBalanceResponse(
        balance=credits_record.credits_balance,
        plan_type=credits_record.plan_type,
        subscription_ends_at=credits_record.subscription_ends_at,
        last_credit_grant_at=credits_record.last_credit_grant_at,
    )


@router.get("/transactions", response_model=CreditTransactionListResponse)
async def get_credit_transactions(
    limit: int = 50,
    offset: int = 0,
    current_user: CurrentUserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Get credit transaction history for the user's business.
    
    Args:
        limit: Maximum number of transactions to return (default 50)
        offset: Number of transactions to skip (for pagination)
    
    Returns:
        CreditTransactionListResponse with list of transactions
    """
    business_id = await _get_user_primary_business_id(db, current_user.user_id)
    
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business found for user"
        )
    
    credit_service = CreditService(db)
    transactions = await credit_service.get_transactions(
        business_id=business_id,
        limit=limit,
        offset=offset
    )
    
    transaction_responses = [
        CreditTransactionResponse(
            transaction_id=t.transaction_id,
            transaction_type=t.transaction_type,
            credits_change=t.credits_change,
            credits_balance_after=t.credits_balance_after,
            reference_id=t.reference_id,
            description=t.description,
            created_at=t.created_at,
        )
        for t in transactions
    ]
    
    return CreditTransactionListResponse(
        transactions=transaction_responses,
        total=len(transaction_responses),  # TODO: Add total count query
        limit=limit,
        offset=offset,
    )


@router.get("/info", response_model=CreditsInfoResponse)
async def get_credits_info(
    current_user: CurrentUserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Get complete credit information including balance and costs.
    
    Returns:
        CreditsInfoResponse with balance, plan, costs, and generation availability
    """
    business_id = await _get_user_primary_business_id(db, current_user.user_id)
    
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business found for user"
        )
    
    credit_service = CreditService(db)
    credits_record = await credit_service.get_credits_record(business_id)
    
    if not credits_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credits record not found"
        )
    
    balance = credits_record.credits_balance
    generation_cost = get_credit_cost(WorkflowTriggerType.CREATE_SITE)

    costs = {trigger.value: get_credit_cost(trigger) for trigger in WorkflowTriggerType}
    return CreditsInfoResponse(
        balance=balance,
        plan_type=credits_record.plan_type,
        costs=costs,
        can_generate=balance >= generation_cost,
        generations_available=balance // generation_cost if generation_cost > 0 else 0,
    )


@router.post("/purchase", response_model=dict)
async def purchase_credits(
    request: PurchaseCreditsRequest = PurchaseCreditsRequest(),
    current_user: CurrentUserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Purchase a credit pack.
    
    Only available to BASIC+ subscribers.
    FREE users should upgrade to BASIC first.
    
    Args:
        request: PurchaseCreditsRequest with pack_id
    
    Returns:
        Checkout session info with URL to complete purchase
    """
    upgrade_service = UpgradeService(db, current_user)
    
    try:
        result = await upgrade_service.create_credit_pack_checkout(request.pack_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create credit pack checkout: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )
