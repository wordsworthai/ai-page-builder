"""
Credit Service - Manages credit operations for businesses.

This service handles all credit-related operations including:
- Adding credits (signup bonus, subscription grants, purchases)
- Deducting credits (generations, AI operations)
- Balance queries and transaction history
"""
import logging
import uuid
from datetime import datetime, UTC
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.config.credits import (
    CreditTransactionType,
    WorkflowTriggerType,
    get_credit_cost,
    get_operation_display_label,
    get_signup_credits,
    get_subscription_credits,
    get_transaction_type_for_operation,
)
from app.shared.models import BusinessCredits, CreditTransaction

logger = logging.getLogger(__name__)


class InsufficientCreditsError(Exception):
    """Raised when a business doesn't have enough credits for an operation."""
    
    def __init__(self, available: int, required: int):
        self.available = available
        self.required = required
        super().__init__(f"Insufficient credits: have {available}, need {required}")


class CreditService:
    """Service for managing business credits."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_balance(self, business_id: uuid.UUID) -> int:
        """
        Get current credit balance for a business.
        
        Args:
            business_id: UUID of the business
            
        Returns:
            Current credit balance (0 if no record found)
        """
        result = await self.db.execute(
            select(BusinessCredits).where(BusinessCredits.business_id == business_id)
        )
        credits = result.scalar_one_or_none()
        
        if not credits:
            logger.warning(f"No credits record found for business {business_id}")
            return 0
        
        return credits.credits_balance
    
    async def get_credits_record(self, business_id: uuid.UUID) -> Optional[BusinessCredits]:
        """
        Get the full credits record for a business.
        
        Args:
            business_id: UUID of the business
            
        Returns:
            BusinessCredits record or None
        """
        result = await self.db.execute(
            select(BusinessCredits).where(BusinessCredits.business_id == business_id)
        )
        return result.scalar_one_or_none()
    
    async def has_sufficient_credits(self, business_id: uuid.UUID, required: int = 10) -> bool:
        """
        Check if business has sufficient credits for an operation.
        
        Args:
            business_id: UUID of the business
            required: Number of credits required (default: 10 for full page generation)
            
        Returns:
            True if sufficient credits, False otherwise
        """
        balance = await self.get_balance(business_id)
        return balance >= required
    
    async def add_credits(
        self,
        business_id: uuid.UUID,
        amount: int,
        transaction_type: CreditTransactionType,
        reference_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> int:
        """
        Add credits to a business account.
        
        Args:
            business_id: UUID of the business
            amount: Number of credits to add (must be positive)
            transaction_type: Type of transaction for audit
            reference_id: Optional reference (e.g., stripe session ID)
            description: Optional description
            
        Returns:
            New balance after adding credits
            
        Raises:
            ValueError: If amount is not positive
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        # Get current credits record
        credits = await self.get_credits_record(business_id)
        if not credits:
            raise ValueError(f"No credits record found for business {business_id}")
        
        # Update balance
        new_balance = credits.credits_balance + amount
        credits.credits_balance = new_balance
        credits.last_credit_grant_at = datetime.now(UTC).replace(tzinfo=None)
        credits.updated_at = datetime.now(UTC).replace(tzinfo=None)
        
        self.db.add(credits)
        
        # Create transaction record
        transaction = CreditTransaction(
            transaction_id=uuid.uuid4(),
            business_id=business_id,
            transaction_type=transaction_type.value,
            credits_change=amount,
            credits_balance_after=new_balance,
            reference_id=reference_id,
            description=description,
            created_at=datetime.now(UTC).replace(tzinfo=None)
        )
        self.db.add(transaction)
        
        await self.db.flush()
        
        logger.info(
            f"Added {amount} credits to business {business_id}. "
            f"Type: {transaction_type.value}, New balance: {new_balance}"
        )
        
        return new_balance
    
    async def deduct_credits(
        self,
        business_id: uuid.UUID,
        amount: int,
        transaction_type: CreditTransactionType,
        reference_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> int:
        """
        Deduct credits from a business account.
        
        Args:
            business_id: UUID of the business
            amount: Number of credits to deduct (must be positive)
            transaction_type: Type of transaction for audit
            reference_id: Optional reference (e.g., generation_version_id)
            description: Optional description
            
        Returns:
            New balance after deducting credits
            
        Raises:
            ValueError: If amount is not positive
            InsufficientCreditsError: If insufficient credits
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        # Get current credits record
        credits = await self.get_credits_record(business_id)
        if not credits:
            raise ValueError(f"No credits record found for business {business_id}")
        
        # Check sufficient balance
        if credits.credits_balance < amount:
            raise InsufficientCreditsError(credits.credits_balance, amount)
        
        # Update balance
        new_balance = credits.credits_balance - amount
        credits.credits_balance = new_balance
        credits.updated_at = datetime.now(UTC).replace(tzinfo=None)
        
        self.db.add(credits)
        
        # Create transaction record (negative change)
        transaction = CreditTransaction(
            transaction_id=uuid.uuid4(),
            business_id=business_id,
            transaction_type=transaction_type.value,
            credits_change=-amount,
            credits_balance_after=new_balance,
            reference_id=reference_id,
            description=description,
            created_at=datetime.now(UTC).replace(tzinfo=None)
        )
        self.db.add(transaction)
        
        await self.db.flush()
        
        logger.info(
            f"Deducted {amount} credits from business {business_id}. "
            f"Type: {transaction_type.value}, New balance: {new_balance}"
        )
        
        return new_balance
    
    async def grant_signup_credits(self, business_id: uuid.UUID) -> int:
        """
        Grant signup bonus credits (20 credits for FREE plan).

        Args:
            business_id: UUID of the business

        Returns:
            New balance after granting credits
        """
        amount = get_signup_credits()
        return await self.add_credits(
            business_id=business_id,
            amount=amount,
            transaction_type=CreditTransactionType.SIGNUP_BONUS,
            description="Early bonus"
        )
    
    async def grant_subscription_credits(self, business_id: uuid.UUID) -> int:
        """
        Grant subscription credits (100 credits for BASIC plan).
        
        Args:
            business_id: UUID of the business
            
        Returns:
            New balance after granting credits
        """
        amount = get_subscription_credits()
        return await self.add_credits(
            business_id=business_id,
            amount=amount,
            transaction_type=CreditTransactionType.SUBSCRIPTION_GRANT,
            description="BASIC subscription"
        )
    
    async def deduct_credits_for_operation(
        self,
        business_id: uuid.UUID,
        operation: WorkflowTriggerType,
        reference_id: str,
        description_override: Optional[str] = None,
    ) -> int:
        """
        Deduct credits for a generation operation. Cost and transaction type
        are determined by the operation. Optional description_override is used
        for the transaction record when provided (e.g. with page context).
        """
        amount = get_credit_cost(operation)
        transaction_type = get_transaction_type_for_operation(operation)
        description = (
            description_override
            if description_override is not None
            else get_operation_display_label(operation)
        )
        return await self.deduct_credits(
            business_id=business_id,
            amount=amount,
            transaction_type=transaction_type,
            reference_id=reference_id,
            description=description,
        )

    async def reset_to_free(self, business_id: uuid.UUID) -> int:
        """
        Reset credits to FREE plan level (20 credits).
        Called when subscription expires/cancels.

        Args:
            business_id: UUID of the business

        Returns:
            New balance (20 credits)
        """
        credits = await self.get_credits_record(business_id)
        if not credits:
            raise ValueError(f"No credits record found for business {business_id}")
        
        free_credits = get_signup_credits()
        old_balance = credits.credits_balance
        
        # Update to FREE plan with 20 credits
        credits.plan_type = "FREE"
        credits.credits_balance = free_credits
        credits.subscription_ends_at = None
        credits.updated_at = datetime.now(UTC).replace(tzinfo=None)
        
        self.db.add(credits)
        
        # Create transaction record for the adjustment
        change = free_credits - old_balance
        transaction = CreditTransaction(
            transaction_id=uuid.uuid4(),
            business_id=business_id,
            transaction_type=CreditTransactionType.PLAN_DOWNGRADE.value,
            credits_change=change,
            credits_balance_after=free_credits,
            description="Plan downgrade to FREE",
            created_at=datetime.now(UTC).replace(tzinfo=None)
        )
        self.db.add(transaction)
        
        await self.db.flush()
        
        logger.info(
            f"Reset business {business_id} to FREE plan with {free_credits} credits. "
            f"Previous balance: {old_balance}"
        )
        
        return free_credits
    
    async def update_plan_type(
        self,
        business_id: uuid.UUID,
        plan_type: str,
        subscription_ends_at: Optional[datetime] = None
    ) -> None:
        """
        Update the plan type for a business.
        
        Args:
            business_id: UUID of the business
            plan_type: New plan type (FREE, BASIC, CUSTOM)
            subscription_ends_at: Optional subscription end date
        """
        credits = await self.get_credits_record(business_id)
        if not credits:
            raise ValueError(f"No credits record found for business {business_id}")
        
        credits.plan_type = plan_type
        credits.subscription_ends_at = subscription_ends_at
        credits.updated_at = datetime.now(UTC).replace(tzinfo=None)
        
        self.db.add(credits)
        await self.db.flush()
        
        logger.info(f"Updated business {business_id} plan to {plan_type}")
    
    async def get_transactions(
        self,
        business_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[CreditTransaction]:
        """
        Get credit transaction history for a business.
        
        Args:
            business_id: UUID of the business
            limit: Maximum number of transactions to return
            offset: Number of transactions to skip
            
        Returns:
            List of CreditTransaction records, newest first
        """
        result = await self.db.execute(
            select(CreditTransaction)
            .where(CreditTransaction.business_id == business_id)
            .order_by(CreditTransaction.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())
    
    async def admin_adjust_credits(
        self,
        business_id: uuid.UUID,
        amount: int,
        description: str
    ) -> int:
        """
        Admin adjustment of credits (can be positive or negative).
        
        Args:
            business_id: UUID of the business
            amount: Credits to add (positive) or remove (negative)
            description: Reason for adjustment
            
        Returns:
            New balance after adjustment
        """
        credits = await self.get_credits_record(business_id)
        if not credits:
            raise ValueError(f"No credits record found for business {business_id}")
        
        new_balance = credits.credits_balance + amount
        if new_balance < 0:
            raise ValueError(f"Adjustment would result in negative balance: {new_balance}")
        
        credits.credits_balance = new_balance
        credits.updated_at = datetime.now(UTC).replace(tzinfo=None)
        
        self.db.add(credits)
        
        transaction = CreditTransaction(
            transaction_id=uuid.uuid4(),
            business_id=business_id,
            transaction_type=CreditTransactionType.ADMIN_ADJUSTMENT.value,
            credits_change=amount,
            credits_balance_after=new_balance,
            description=description,
            created_at=datetime.now(UTC).replace(tzinfo=None)
        )
        self.db.add(transaction)
        
        await self.db.flush()
        
        logger.info(
            f"Admin adjusted credits for business {business_id} by {amount}. "
            f"New balance: {new_balance}. Reason: {description}"
        )
        
        return new_balance
