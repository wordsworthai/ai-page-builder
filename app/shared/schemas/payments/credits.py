"""
Credit-related request and response schemas.

These schemas define the API contract for credit operations.
"""
import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CreditsBalanceResponse(BaseModel):
    """Response for credit balance query."""
    
    balance: int = Field(..., description="Current credit balance")
    plan_type: str = Field(..., description="Current plan type (FREE, BASIC, CUSTOM)")
    subscription_ends_at: Optional[datetime] = Field(
        default=None, 
        description="When subscription ends (for cancellation handling)"
    )
    last_credit_grant_at: Optional[datetime] = Field(
        default=None,
        description="When credits were last added"
    )


class CreditTransactionResponse(BaseModel):
    """Response for a single credit transaction."""
    
    transaction_id: uuid.UUID = Field(..., description="Unique transaction ID")
    transaction_type: str = Field(..., description="Type of transaction")
    credits_change: int = Field(..., description="Credits added (positive) or deducted (negative)")
    credits_balance_after: int = Field(..., description="Balance after this transaction")
    reference_id: Optional[str] = Field(
        default=None,
        description="Reference ID (e.g., generation_version_id, stripe_session_id)"
    )
    description: Optional[str] = Field(default=None, description="Transaction description")
    created_at: datetime = Field(..., description="When transaction occurred")


class CreditTransactionListResponse(BaseModel):
    """Response for listing credit transactions."""
    
    transactions: List[CreditTransactionResponse] = Field(
        default_factory=list,
        description="List of transactions"
    )
    total: int = Field(..., description="Total number of transactions")
    limit: int = Field(..., description="Page size")
    offset: int = Field(..., description="Current offset")


class PurchaseCreditsRequest(BaseModel):
    """Request to purchase a credit pack."""
    
    pack_id: str = Field(
        default="credits-100",
        description="Credit pack ID to purchase"
    )
    success_url: Optional[str] = Field(
        default=None,
        description="Custom success URL after purchase"
    )
    cancel_url: Optional[str] = Field(
        default=None,
        description="Custom cancel URL"
    )


class CreditsInfoResponse(BaseModel):
    """Complete credits information response."""

    balance: int = Field(..., description="Current credit balance")
    plan_type: str = Field(..., description="Current plan type")
    costs: dict[str, int] = Field(
        ...,
        description="Credit cost per operation (key = workflow trigger type value, e.g. create-site)"
    )
    can_generate: bool = Field(
        ...,
        description="Whether user has enough credits for a generation"
    )
    generations_available: int = Field(
        ...,
        description="Number of full page generations available with current balance"
    )
