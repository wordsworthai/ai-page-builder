"""
Core Payment Manager - Orchestrates all payment operations
Handles both subscription and one-time payments with comprehensive error handling
"""

import logging
import uuid
from datetime import datetime, timedelta, UTC
from typing import Dict, List, Optional, Union

import stripe
from fastapi import Depends, Request
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.shared.config.payments import payment_config
from app.core.config import FRONTEND_URL
from app.core.exceptions import (CustomerNotFoundError,
                                 InvalidProductError,
                                 PaymentConfigurationError,
                                 PaymentErrorContext, PaymentProcessingError,
                                 SubscriptionError, handle_stripe_errors)
from app.core.db import get_async_db_session
from app.shared.models import (
    BusinessUser,
    CreditTransaction,
    Purchase,
    Subscription,
    SubscriptionStatus,
    User,
)
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.schemas.payments.payment import (CancelSubscriptionRequest,
                                 CheckoutSessionResponse,
                                 CreateCheckoutRequest, CustomerPortalResponse,
                                 PaymentResponse, PaymentStatus, PaymentType,
                                 ProductResponse, SubscriptionResponse)
from app.shared.services.auth.users_service import get_current_user_optional
from app.core.access_control import update_user_plan
from app.shared.services.payments.credit_service import CreditService
from app.shared.config.credits import CreditTransactionType

logger = logging.getLogger(__name__)

# Initialize Stripe conditionally
if not payment_config.stripe.api_key.endswith("_not_configured"):
    stripe.api_key = payment_config.stripe.api_key


class PaymentManager:
    """
    Core payment manager that handles all payment operations
    """

    def __init__(
        self,
        db: AsyncSession,
        current_user: Optional[CurrentUserResponse] = None,
        request: Optional[Request] = None,
    ):
        self.db = db
        self.current_user = current_user
        self.request = request
        self.config = payment_config

    def _validate_stripe_config(self):
        """Validate that Stripe is properly configured"""
        if self.config.stripe.api_key.endswith(
            "_not_configured"
        ) or self.config.stripe.publishable_key.endswith("_not_configured"):
            raise PaymentConfigurationError(
                "Stripe API keys are not configured. Please set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY environment variables."
            )

        if not stripe.api_key or stripe.api_key.endswith("_not_configured"):
            raise PaymentConfigurationError(
                "Stripe API key is not properly initialized."
            )



    # Product Management
    async def get_products(self) -> List[ProductResponse]:
        """Get all available products"""
        products = []
        for _, product_config in self.config.products.items():
            products.append(
                ProductResponse(
                    id=product_config.id,
                    name=product_config.name,
                    description=product_config.description,
                    type=(
                        PaymentType.SUBSCRIPTION
                        if product_config.type == "subscription"
                        else PaymentType.ONE_TIME
                    ),
                    price_cents=product_config.price_cents,
                    currency=product_config.currency,
                    trial_period_days=product_config.trial_period_days,
                    features=product_config.features,
                )
            )
        return products

    async def get_product(self, product_id: str) -> ProductResponse:
        """Get a specific product by ID"""
        if product_id not in self.config.products:
            raise InvalidProductError(product_id)

        product_config = self.config.products[product_id]
        return ProductResponse(
            id=product_config.id,
            name=product_config.name,
            description=product_config.description,
            type=(
                PaymentType.SUBSCRIPTION
                if product_config.type == "subscription"
                else PaymentType.ONE_TIME
            ),
            price_cents=product_config.price_cents,
            currency=product_config.currency,
            trial_period_days=product_config.trial_period_days,
            features=product_config.features,
        )

    # Checkout Session Creation
    @handle_stripe_errors
    async def create_checkout_session(
        self, request: CreateCheckoutRequest
    ) -> CheckoutSessionResponse:
        """Create a checkout session for either one-time or subscription payment"""

        # Validate Stripe configuration
        self._validate_stripe_config()

        # Validate product exists
        if request.product_id not in self.config.products:
            raise InvalidProductError(request.product_id)

        product_config = self.config.products[request.product_id]

        # Check if product has valid Stripe price ID
        if product_config.stripe_price_id.endswith("_placeholder"):
            raise PaymentConfigurationError(
                f"Product '{request.product_id}' is not properly configured with a valid Stripe price ID."
            )

        # Ensure user is authenticated
        if not self.current_user:
            raise PaymentProcessingError(
                "User must be authenticated to create checkout session"
            )

        with PaymentErrorContext(
            "create_checkout_session", product_id=request.product_id
        ):

            # Create or get Stripe customer
            customer_id = await self._get_or_create_stripe_customer()

            # Build URLs properly - use frontend URL for Stripe redirects
            base_domain = FRONTEND_URL.rstrip('/')
            
            # Handle success URL - use Stripe's session_id parameter
            if request.success_url:
                if request.success_url.startswith('http'):
                    # Remove any existing session_id placeholder and add proper Stripe parameter
                    clean_url = request.success_url.replace('?session_id={session_id}', '').replace('&session_id={session_id}', '')
                    success_url = f"{clean_url}{'&' if '?' in clean_url else '?'}session_id={{CHECKOUT_SESSION_ID}}"
                else:
                    success_path = request.success_url if request.success_url.startswith('/') else '/' + request.success_url
                    clean_path = success_path.replace('?session_id={session_id}', '').replace('&session_id={session_id}', '')
                    success_url = f"{base_domain}{clean_path}{'&' if '?' in clean_path else '?'}session_id={{CHECKOUT_SESSION_ID}}"
            else:
                # Use default template but clean it up
                success_path = self.config.success_url_template
                if not success_path.startswith('/'):
                    success_path = '/' + success_path
                clean_path = success_path.replace('?session_id={session_id}', '').replace('&session_id={session_id}', '')
                success_url = f"{base_domain}{clean_path}{'&' if '?' in clean_path else '?'}session_id={{CHECKOUT_SESSION_ID}}"
            
            # Handle cancel URL
            if request.cancel_url:
                if request.cancel_url.startswith('http'):
                    cancel_url = request.cancel_url
                else:
                    cancel_path = request.cancel_url if request.cancel_url.startswith('/') else '/' + request.cancel_url
                    cancel_url = f"{base_domain}{cancel_path}"
            else:
                cancel_path = self.config.cancel_url
                if not cancel_path.startswith('/'):
                    cancel_path = '/' + cancel_path
                cancel_url = f"{base_domain}{cancel_path}"
            
            logger.info(f"Creating checkout with URLs - Success: {success_url}, Cancel: {cancel_url}")
            
            # Build checkout session parameters
            session_params = {
                "customer": customer_id,
                "payment_method_types": ["card"],
                "success_url": success_url,
                "cancel_url": cancel_url,
                "metadata": {
                    "product_id": request.product_id,
                    "user_id": str(self.current_user.user_id),
                    **(request.metadata or {}),
                },
            }
            
            # Add optional parameters
            if request.allow_promotion_codes is not None:
                session_params["allow_promotion_codes"] = request.allow_promotion_codes

            # Configure for subscription vs one-time payment
            if product_config.type == "subscription":
                session_params.update(
                    {
                        "mode": "subscription",
                        "line_items": [{"price": product_config.stripe_price_id, "quantity": 1}],
                        "subscription_data": {
                            "metadata": session_params["metadata"],
                        },
                    }
                )

                # Add trial period if configured
                if product_config.trial_period_days:
                    session_params["subscription_data"][
                        "trial_period_days"
                    ] = product_config.trial_period_days

            else:  # one-time payment
                session_params.update(
                    {
                        "mode": "payment",
                        "line_items": [
                            {"price": product_config.stripe_price_id, "quantity": 1}
                        ],
                    }
                )

            # Create the checkout session
            session = stripe.checkout.Session.create(**session_params)

            # Log the session creation
            logger.info(
                "Created checkout session for user %s, product %s",
                self.current_user.user_id,
                request.product_id,
                extra={
                    "user_id": str(self.current_user.user_id),
                    "product_id": request.product_id,
                    "session_id": session.id,
                    "payment_type": product_config.type,
                },
            )

            return CheckoutSessionResponse(
                checkout_url=session.url,
                session_id=session.id,
                expires_at=datetime.fromtimestamp(session.expires_at),
            )

    @handle_stripe_errors
    async def _get_or_create_stripe_customer(self) -> str:
        """Get existing Stripe customer or create new one"""

        # Validate Stripe configuration
        self._validate_stripe_config()

        # Get user from database
        user_stmt = select(User).where(User.id == self.current_user.user_id)
        user_result = await self.db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            raise CustomerNotFoundError(str(self.current_user.user_id))

        # Return existing customer ID if available
        if user.stripe_customer_id:
            return user.stripe_customer_id

        # Create new Stripe customer
        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name,
            metadata={"user_id": str(user.id)},
        )

        # Update user record with customer ID
        user.stripe_customer_id = customer.id
        await self.db.commit()

        return customer.id

    # Payment Processing
    @handle_stripe_errors
    async def handle_successful_checkout(
        self, session_id: str
    ) -> Union[PaymentResponse, SubscriptionResponse]:
        """Handle successful checkout completion"""

        with PaymentErrorContext("handle_successful_checkout", session_id=session_id):

            # Retrieve the checkout session
            session = stripe.checkout.Session.retrieve(
                session_id, expand=["line_items", "subscription", "payment_intent"]
            )

            # Extract metadata
            product_id = session.metadata.get("product_id")
            user_id = session.metadata.get("user_id")

            if not product_id or not user_id:
                raise PaymentProcessingError(
                    "Missing required metadata in checkout session"
                )

            # Get product configuration
            if product_id not in self.config.products:
                raise InvalidProductError(product_id)

            product_config = self.config.products[product_id]

            # Handle based on payment type
            if product_config.type == "subscription":
                return await self._handle_subscription_success(
                    session, product_config, uuid.UUID(user_id)
                )

            # Route credit packs separately from other one-time purchases
            if product_config.is_credit_pack:
                return await self._handle_credit_pack_success(
                    session, product_config, uuid.UUID(user_id)
                )

            return await self._handle_one_time_payment_success(
                session, product_config, uuid.UUID(user_id)
            )

    async def _handle_one_time_payment_success(
        self, session: stripe.checkout.Session, product_config, user_id: uuid.UUID
    ) -> PaymentResponse:
        """Handle successful one-time payment"""

        payment_intent_id = (
            session.payment_intent.id if session.payment_intent else None
        )

        # Check for duplicate payment
        existing_stmt = select(Purchase).where(
            Purchase.transaction_id == payment_intent_id
        )
        existing_result = await self.db.execute(existing_stmt)
        existing_purchase = existing_result.scalar_one_or_none()
        if existing_purchase:
            # Return existing purchase instead of error (for idempotency)
            logger.info(f"Returning existing purchase for payment intent {payment_intent_id}")
            return PaymentResponse(
                id=existing_purchase.id,
                status=PaymentStatus.SUCCEEDED,
                amount=int(existing_purchase.amount * 100),
                currency=existing_purchase.currency,
                product_id=product_config.id,
                stripe_payment_intent_id=payment_intent_id,
                created_at=existing_purchase.purchase_date,
                updated_at=existing_purchase.purchase_date,
            )



        # Create purchase record
        purchase = Purchase(
            id=uuid.uuid4(),
            user_id=user_id,
            product_type=product_config.id,
            price_id=product_config.stripe_price_id,
            transaction_id=payment_intent_id,
            amount=session.amount_total / 100,  # Convert from cents
            currency=session.currency.upper(),
            is_successful=True,
            purchase_date=datetime.now(UTC).replace(tzinfo=None),
        )

        purchase_id = purchase.id
        purchase_amount = purchase.amount
        purchase_currency = purchase.currency
        purchase_date = purchase.purchase_date
        
        self.db.add(purchase)
        await self.db.commit()

        # Update user's plan based on the new purchase
        user = await self.db.get(User, user_id)
        if user:
            await update_user_plan(user, self.db)
            logger.info(f"Updated user {user_id} plan after purchase")

        logger.info(
            "Processed one-time payment for user %s, product %s",
            user_id,
            product_config.id,
            extra={
                "user_id": str(user_id),
                "product_id": product_config.id,
                "payment_intent_id": payment_intent_id,
                "amount": purchase_amount,
            },
        )

        return PaymentResponse(
            id=purchase_id,
            status=PaymentStatus.SUCCEEDED,
            amount=int(purchase_amount * 100),  # Convert back to cents
            currency=purchase_currency,
            product_id=product_config.id,
            stripe_payment_intent_id=payment_intent_id,
            created_at=purchase_date,
            updated_at=purchase_date,
        )

    async def _handle_subscription_success(
        self, session: stripe.checkout.Session, product_config, user_id: uuid.UUID
    ) -> SubscriptionResponse:
        """Handle successful subscription creation and grant credits"""

        stripe_subscription = session.subscription
        if not stripe_subscription:
            raise SubscriptionError("No subscription found in checkout session")

        # Get full subscription details
        subscription = stripe.Subscription.retrieve(stripe_subscription.id)

        # Check for existing subscription
        existing_stmt = select(Subscription).where(Subscription.user_id == user_id)
        existing_result = await self.db.execute(existing_stmt)
        existing_subscription = existing_result.scalar_one_or_none()

        # Grant credits when new OR when re-subscribing after cancel/expire
        is_new_subscription = (
            existing_subscription is None
            or existing_subscription.status
            in (SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED)
        )
        # End: Grant credits when new OR when re-subscribing after cancel/expire

        if existing_subscription:
            # Update existing subscription
            existing_subscription.stripe_subscription_id = subscription.id
            existing_subscription.plan = product_config.id
            existing_subscription.status = self._map_stripe_subscription_status(
                subscription.status
            )
            existing_subscription.start_date = datetime.fromtimestamp(
                subscription.current_period_start
            )
            existing_subscription.end_date = datetime.fromtimestamp(
                subscription.current_period_end
            )

            db_subscription = existing_subscription
        else:
            # Create new subscription
            db_subscription = Subscription(
                id=uuid.uuid4(),
                user_id=user_id,
                stripe_subscription_id=subscription.id,
                plan=product_config.id,
                status=self._map_stripe_subscription_status(subscription.status),
                start_date=datetime.fromtimestamp(subscription.current_period_start),
                end_date=datetime.fromtimestamp(subscription.current_period_end),
            )
            self.db.add(db_subscription)

        subscription_id = db_subscription.id
        subscription_status = db_subscription.status
        subscription_start_date = db_subscription.start_date
        subscription_end_date = db_subscription.end_date
        
        await self.db.commit()

        # Update user's plan based on the new subscription
        user = await self.db.get(User, user_id)
        if user:
            await update_user_plan(user, self.db)

        # Grant credits for new subscription (mirrors credit pack flow; webhook may also run in prod)
        stripe_subscription_id = subscription.id
        if is_new_subscription and product_config.credits_granted > 0:
            stmt = select(BusinessUser.business_id).where(BusinessUser.user_id == user_id)
            result = await self.db.execute(stmt)
            business_ids = [row[0] for row in result.all()]

            if not business_ids:
                raise PaymentProcessingError(
                    "User must create a business before upgrading. Please create a website first."
                )

            # Idempotency: skip if already fulfilled (e.g. by webhook)
            idempotency_stmt = (
                select(CreditTransaction).where(
                    CreditTransaction.business_id.in_(business_ids),
                    CreditTransaction.reference_id == stripe_subscription_id,
                    CreditTransaction.transaction_type == CreditTransactionType.SUBSCRIPTION_GRANT.value,
                )
            )
            idempotency_result = await self.db.execute(idempotency_stmt)
            if idempotency_result.scalar_one_or_none() is not None:
                pass  # Already fulfilled (e.g. by webhook)
            else:
                credit_service = CreditService(self.db)
                for business_id in business_ids:
                    try:
                        await credit_service.add_credits(
                            business_id=business_id,
                            amount=product_config.credits_granted,
                            transaction_type=CreditTransactionType.SUBSCRIPTION_GRANT,
                            reference_id=stripe_subscription_id,
                            description=f"Subscription grant: {product_config.id}",
                        )
                        if product_config.plan_type:
                            await credit_service.update_plan_type(
                                business_id, product_config.plan_type.upper()
                            )
                    except Exception as e:
                        logger.error(
                            f"Failed to grant credits to business {business_id}: {e}"
                        )
                await self.db.commit()
        # End: Grant credits for new subscription
        
        return SubscriptionResponse(
            id=subscription_id,
            status=subscription_status,
            plan_id=product_config.id,
            current_period_start=subscription_start_date,
            current_period_end=subscription_end_date,
            trial_end=(
                datetime.fromtimestamp(subscription.trial_end)
                if subscription.trial_end
                else None
            ),
            cancel_at_period_end=subscription.cancel_at_period_end,
            stripe_subscription_id=subscription.id,
            created_at=subscription_start_date,
            updated_at=subscription_start_date,
        )

    async def _handle_credit_pack_success(
        self, session: stripe.checkout.Session, product_config, user_id: uuid.UUID
    ) -> PaymentResponse:
        """Handle successful credit pack purchase."""
        
        payment_intent_id = (
            session.payment_intent.id if session.payment_intent else None
        )

        # Check for duplicate payment
        existing_stmt = select(Purchase).where(
            Purchase.transaction_id == payment_intent_id
        )
        existing_result = await self.db.execute(existing_stmt)
        existing_purchase = existing_result.scalar_one_or_none()
        if existing_purchase:
            logger.info(f"Returning existing purchase for payment intent {payment_intent_id}")
            return PaymentResponse(
                id=existing_purchase.id,
                status=PaymentStatus.SUCCEEDED,
                amount=int(existing_purchase.amount * 100),
                currency=existing_purchase.currency,
                product_id=product_config.id,
                stripe_payment_intent_id=payment_intent_id,
                created_at=existing_purchase.purchase_date,
                updated_at=existing_purchase.purchase_date,
            )

        # Create purchase record
        purchase = Purchase(
            id=uuid.uuid4(),
            user_id=user_id,
            product_type=product_config.id,
            price_id=product_config.stripe_price_id,
            transaction_id=payment_intent_id,
            amount=session.amount_total / 100,
            currency=session.currency.upper(),
            is_successful=True,
            purchase_date=datetime.now(UTC).replace(tzinfo=None),
        )

        # Store values before commit to avoid SQLAlchemy detached state issues
        purchase_id = purchase.id
        purchase_amount = purchase.amount
        purchase_currency = purchase.currency
        purchase_date = purchase.purchase_date

        self.db.add(purchase)
        await self.db.commit()

        credits_to_add = product_config.credits_granted
        
        # Find user's businesses and add credits
        stmt = select(BusinessUser.business_id).where(BusinessUser.user_id == user_id)
        result = await self.db.execute(stmt)
        business_ids = [row[0] for row in result.all()]
        
        credit_service = CreditService(self.db)
        
        for business_id in business_ids:
            try:
                await credit_service.add_credits(
                    business_id=business_id,
                    amount=credits_to_add,
                    transaction_type=CreditTransactionType.ADDON_PURCHASE,
                    reference_id=payment_intent_id,
                    description=f"Credit pack purchase: {product_config.id}"
                )
                logger.info(f"Added {credits_to_add} credits to business {business_id}")
            except Exception as e:
                logger.error(f"Failed to add credits to business {business_id}: {e}")
        
        await self.db.commit()

        logger.info(
            "Processed credit pack purchase for user %s",
            user_id,
            extra={
                "user_id": str(user_id),
                "product_id": product_config.id,
                "credits_added": credits_to_add,
            },
        )

        return PaymentResponse(
            id=purchase_id,
            status=PaymentStatus.SUCCEEDED,
            amount=int(purchase_amount * 100),
            currency=purchase_currency,
            product_id=product_config.id,
            stripe_payment_intent_id=payment_intent_id,
            created_at=purchase_date,
            updated_at=purchase_date,
        )

    def _map_stripe_subscription_status(self, stripe_status: str) -> str:
        """Map Stripe subscription status to our enum value"""
        mapping = {
            "active": SubscriptionStatus.ACTIVE.value,
            "trialing": SubscriptionStatus.TRIALING.value,
            "past_due": SubscriptionStatus.PAST_DUE.value,
            "canceled": SubscriptionStatus.CANCELED.value,
            "unpaid": SubscriptionStatus.UNPAID.value,
            "incomplete": SubscriptionStatus.INCOMPLETE.value,
            "incomplete_expired": SubscriptionStatus.INCOMPLETE_EXPIRED.value,
        }
        return mapping.get(stripe_status, SubscriptionStatus.EXPIRED.value)

    # Subscription Management
    @handle_stripe_errors
    async def cancel_subscription(
        self, request: CancelSubscriptionRequest
    ) -> SubscriptionResponse:
        """Cancel user's subscription"""

        if not self.current_user:
            raise PaymentProcessingError("User must be authenticated")

        # Get user's subscription
        stmt = select(Subscription).where(
            Subscription.user_id == self.current_user.user_id
        )
        result = await self.db.execute(stmt)
        subscription = result.scalar_one_or_none()

        if not subscription or not subscription.stripe_subscription_id:
            raise SubscriptionError("No active subscription found")

        # Store values we need for the response and async operations
        subscription_id = subscription.id
        subscription_status = subscription.status
        subscription_plan = subscription.plan
        subscription_start_date = subscription.start_date
        subscription_end_date = subscription.end_date
        stripe_subscription_id = subscription.stripe_subscription_id
        user_id = self.current_user.user_id
        cancel_at_period_end = not request.immediately

        # Perform Stripe operations (sync) inside the error context
        with PaymentErrorContext(
            "cancel_subscription", subscription_id=stripe_subscription_id
        ):
            # Cancel the Stripe subscription
            if request.immediately:
                stripe.Subscription.delete(stripe_subscription_id)
                subscription.status = SubscriptionStatus.CANCELED
                subscription.end_date = datetime.now(UTC).replace(tzinfo=None)
                subscription_status = subscription.status
                subscription_end_date = subscription.end_date
            else:
                # Cancel at period end - Stripe will send webhook when period ends
                stripe.Subscription.modify(
                    stripe_subscription_id, cancel_at_period_end=True
                )

        # Commit the subscription status change
        await self.db.commit()

        # Now perform async credit operations outside the sync context manager
        try:
            if request.immediately:
                # Immediately reset user's businesses to FREE plan
                await self._reset_businesses_to_free(user_id)
            else:
                # Update business credits to track when subscription will end
                # This helps display the cancellation date to the user
                await self._set_subscription_end_date(user_id, subscription_end_date)
        except Exception as e:
            # Log but don't fail the cancellation if credit update fails
            logger.error(f"Failed to update credits after cancellation: {e}")

        logger.info(
            "Canceled subscription for user %s",
            user_id,
            extra={
                "user_id": str(user_id),
                "subscription_id": stripe_subscription_id,
                "immediately": request.immediately,
            },
        )

        return SubscriptionResponse(
            id=subscription_id,
            status=subscription_status,
            plan_id=subscription_plan,
            current_period_start=subscription_start_date,
            current_period_end=subscription_end_date,
            cancel_at_period_end=cancel_at_period_end,
            stripe_subscription_id=stripe_subscription_id,
            created_at=subscription_start_date,
            updated_at=datetime.now(UTC).replace(tzinfo=None),
        )

    async def _set_subscription_end_date(
        self, user_id: uuid.UUID, subscription_ends_at: datetime
    ) -> None:
        """Set subscription end date in business credits for cancellation tracking."""
        stmt = select(BusinessUser.business_id).where(BusinessUser.user_id == user_id)
        result = await self.db.execute(stmt)
        business_ids = [row[0] for row in result.all()]
        
        if not business_ids:
            logger.warning(f"No businesses found for user {user_id} to set subscription end date")
            return
        
        credit_service = CreditService(self.db)
        
        for business_id in business_ids:
            try:
                await credit_service.update_plan_type(
                    business_id, 
                    "BASIC",  # Keep as BASIC until period ends
                    subscription_ends_at=subscription_ends_at
                )
                logger.info(f"Set subscription end date {subscription_ends_at} for business {business_id}")
            except Exception as e:
                logger.error(f"Failed to set subscription end date for business {business_id}: {e}")
        
        await self.db.commit()

    async def _reset_businesses_to_free(self, user_id: uuid.UUID) -> None:
        """Reset user's businesses to FREE plan with 20 credits (for immediate cancellation)."""
        stmt = select(BusinessUser.business_id).where(BusinessUser.user_id == user_id)
        result = await self.db.execute(stmt)
        business_ids = [row[0] for row in result.all()]
        
        if not business_ids:
            logger.warning(f"No businesses found for user {user_id}")
            return
        
        credit_service = CreditService(self.db)
        
        for business_id in business_ids:
            try:
                await credit_service.reset_to_free(business_id)
                logger.info(f"Reset business {business_id} to FREE plan")
            except Exception as e:
                logger.error(f"Failed to reset business {business_id}: {e}")
        
        await self.db.commit()

    @handle_stripe_errors
    async def create_customer_portal_session(
        self, return_url: Optional[str] = None
    ) -> CustomerPortalResponse:
        """Create a customer portal session for subscription management"""

        if not self.current_user:
            raise PaymentProcessingError("User must be authenticated")

        # Get user's Stripe customer ID
        customer_id = await self._get_or_create_stripe_customer()

        # Create portal session
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url or f"{self.config.domain}/dashboard",
        )

        return CustomerPortalResponse(
            portal_url=session.url,
            expires_at=datetime.now(UTC).replace(tzinfo=None)
            + timedelta(hours=1),  # Portal sessions typically expire in 1 hour
        )



    # User Payment Information
    async def get_user_payment_info(self) -> Dict:
        """Get comprehensive payment information for the current user"""

        if not self.current_user:
            raise PaymentProcessingError("User must be authenticated")

        # Get user's subscription
        subscription_stmt = select(Subscription).where(
            Subscription.user_id == self.current_user.user_id
        )
        subscription_result = await self.db.execute(subscription_stmt)
        subscription = subscription_result.scalar_one_or_none()

        # Get user's purchases
        purchases_stmt = (
            select(Purchase)
            .where(Purchase.user_id == self.current_user.user_id)
            .order_by(Purchase.purchase_date.desc())
            .limit(10)
        )
        purchases_result = await self.db.execute(purchases_stmt)
        purchases = purchases_result.scalars().all()

        # Calculate total spent
        total_spent = sum(
            purchase.amount * 100 for purchase in purchases
        )  # Convert to cents

        return {
            "active_subscription": subscription,
            "recent_payments": purchases,
            "total_spent": int(total_spent),
        }


# Dependency injection
def get_payment_manager(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
    request: Request = None,
) -> PaymentManager:
    return PaymentManager(db_session, current_user, request)
