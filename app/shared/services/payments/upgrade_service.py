"""
Plan Upgrade Service - Simplified for Credit-based System

Handles:
- FREE → BASIC upgrade (subscription)
- Credit pack purchases (for BASIC+ users)
"""

import logging
from typing import Optional, Dict, Any

import stripe
from fastapi import Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_async_db_session
from app.shared.models import User, BusinessUser
from app.core.permissions import PlanType
from app.core.access_control import get_user_current_plan
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.services.auth.users_service import get_current_user_optional
from app.shared.services.payments.credit_service import CreditService
from app.shared.config.payments import load_payment_config
from app.core.config import FRONTEND_URL

logger = logging.getLogger(__name__)
payment_config = load_payment_config()

# Initialize Stripe
if not payment_config.stripe.api_key.endswith("_not_configured"):
    stripe.api_key = payment_config.stripe.api_key


class UpgradeService:
    """Service for handling plan upgrades - simplified for 3-tier system"""
    
    def __init__(self, db: AsyncSession, current_user: Optional[CurrentUserResponse]):
        self.db = db
        self.current_user = current_user
    
    async def get_upgrade_options(self) -> Dict[str, Any]:
        """
        Get available upgrade options for the current user.
        
        Only shows:
        - FREE users: BASIC subscription option
        - BASIC+ users: Credit pack purchase options
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        current_plan = await get_user_current_plan(user, self.db)
        
        # Get credit balance
        credits_balance = await self._get_user_credits_balance(user.id)
        
        upgrade_options = []
        credit_pack_options = []
        
        if current_plan == PlanType.FREE:
            # FREE users can upgrade to BASIC
            upgrade_options.append({
                "plan": "basic",
                "name": "Basic Plan",
                "billing_type": "subscription",
                "price_cents": 999,
                "price_formatted": "$9.99/month",
                "features": [
                    "100 credits on subscription",
                    "Buy additional credit packs",
                    "All generation features",
                    "Website publishing",
                    "Priority support",
                ],
                "credits_granted": 100,
            })
        else:
            # BASIC+ users can buy credit packs
            credit_pack_options.append({
                "pack_id": "credits-100",
                "name": "100 Credits Pack",
                "price_cents": 999,
                "price_formatted": "$9.99",
                "credits": 100,
                "description": "Add 100 credits to your balance",
            })
        
        return {
            "current_plan": current_plan.value,
            "credits_balance": credits_balance,
            "can_upgrade": current_plan == PlanType.FREE,
            "can_buy_credits": current_plan != PlanType.FREE,
            "upgrade_options": upgrade_options,
            "credit_pack_options": credit_pack_options,
        }
    
    async def create_upgrade_checkout(self, target_plan: str = "basic") -> Dict[str, Any]:
        """
        Create checkout session for upgrading to BASIC plan.
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        current_plan = await get_user_current_plan(user, self.db)
        
        # Only FREE users can upgrade
        if current_plan != PlanType.FREE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active subscription. Use credit packs to add more credits."
            )
        
        if target_plan != "basic":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only BASIC plan is available for upgrade"
            )
        
        # Get or create Stripe customer
        customer_id = await self._get_or_create_customer(user)
        
        # Get price ID (use stripe_price_pb_basic to match plans.py product registration)
        from app.shared.config.payments import PaymentSettings
        settings = PaymentSettings()
        price_id = settings.stripe_price_pb_basic
        
        if price_id.endswith("_placeholder"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment configuration not complete. Please contact support."
            )
        
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                mode='subscription',
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                success_url=f"{FRONTEND_URL}/dashboard/billing?plan_upgrade=success&session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{FRONTEND_URL}/dashboard/billing",
                metadata={
                    "user_id": str(user.id),
                    "product_id": "basic",
                    "upgrade_type": "free_to_basic",
                },
                subscription_data={
                    "metadata": {
                        "user_id": str(user.id),
                        "plan": "basic",
                    },
                },
            )
            
            return {
                "session_id": session.id,
                "url": session.url,
                "upgrade_type": "subscription",
                "target_plan": "basic",
                "credits_to_receive": 100,
            }
            
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create checkout session: {str(e)}"
            )
    
    async def create_credit_pack_checkout(self, pack_id: str = "credits-100") -> Dict[str, Any]:
        """
        Create checkout session for purchasing a credit pack.
        Only available to BASIC+ subscribers.
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        current_plan = await get_user_current_plan(user, self.db)
        
        # Only BASIC+ users can buy credit packs
        if current_plan == PlanType.FREE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Credit packs are only available to subscribers. Please upgrade to BASIC first."
            )
        
        if pack_id != "credits-100":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown credit pack: {pack_id}"
            )
        
        # Get or create Stripe customer
        customer_id = await self._get_or_create_customer(user)
        
        # Get price ID (use stripe_price_pb_credits_100 to match plans.py product registration)
        from app.shared.config.payments import PaymentSettings
        settings = PaymentSettings()
        price_id = settings.stripe_price_pb_credits_100
        
        if price_id.endswith("_placeholder"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment configuration not complete. Please contact support."
            )
        
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                mode='payment',
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                success_url=f"{FRONTEND_URL}/dashboard/billing?credit_purchase=success&session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{FRONTEND_URL}/dashboard/billing",
                metadata={
                    "user_id": str(user.id),
                    "product_id": pack_id,
                    "purchase_type": "credit_pack",
                },
            )
            
            return {
                "session_id": session.id,
                "url": session.url,
                "purchase_type": "credit_pack",
                "pack_id": pack_id,
                "credits_to_receive": 100,
            }
            
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create checkout session: {str(e)}"
            )
    
    async def _get_user_credits_balance(self, user_id) -> int:
        """Get total credits balance across user's businesses."""
        stmt = select(BusinessUser.business_id).where(BusinessUser.user_id == user_id)
        result = await self.db.execute(stmt)
        business_ids = [row[0] for row in result.all()]
        
        if not business_ids:
            return 0
        
        credit_service = CreditService(self.db)
        total = 0
        for business_id in business_ids:
            balance = await credit_service.get_balance(business_id)
            total += balance
        
        return total
    
    async def _get_or_create_customer(self, user: User) -> str:
        """Get or create Stripe customer"""
        if user.stripe_customer_id:
            return user.stripe_customer_id
        
        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name,
            metadata={"user_id": str(user.id)},
        )
        
        user.stripe_customer_id = customer.id
        self.db.add(user)
        await self.db.commit()
        
        return customer.id


def get_upgrade_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
) -> UpgradeService:
    """Get an instance of the UpgradeService class."""
    return UpgradeService(db_session, current_user)
