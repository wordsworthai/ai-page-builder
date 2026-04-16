"""
Payment endpoint tests.

All Stripe API calls are mocked — no real network requests are made.

Route prefix: /api/payments/
Products registered via PAGE_BUILDER_PRODUCTS:
  - "basic"        → subscription, price_pb_basic_placeholder
  - "credits-100"  → one_time credit pack, price_pb_credits_100_placeholder
"""

import uuid
from datetime import datetime, timedelta, UTC
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.schemas.payments.payment import (
    CheckoutSessionResponse,
    CustomerPortalResponse,
    PaymentType,
    ProductResponse,
    SubscriptionResponse,
    SubscriptionStatus,
)
from app.shared.services.payments.payment_manager import PaymentManager, get_payment_manager
from app.shared.services.auth.users_service import get_current_user
from app.shared.services.payments.webhook_handler import WebhookHandler, get_webhook_handler
from main import app


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_current_user(**kwargs) -> CurrentUserResponse:
    defaults = dict(
        email="test@example.com",
        full_name="Test User",
        user_id=str(uuid.uuid4()),
        verified=True,
        auth_provider="email",
        business_id=str(uuid.uuid4()),
        business_name="Test Business",
    )
    defaults.update(kwargs)
    return CurrentUserResponse(**defaults)


_NOW = datetime.now(UTC).replace(tzinfo=None)


def _sub_response(**kwargs) -> SubscriptionResponse:
    defaults = dict(
        id=uuid.uuid4(),
        status=SubscriptionStatus.ACTIVE,
        plan_id="basic",
        current_period_start=_NOW,
        current_period_end=_NOW + timedelta(days=30),
        trial_end=None,
        cancel_at_period_end=False,
        stripe_subscription_id="sub_test_123",
        created_at=_NOW,
        updated_at=_NOW,
    )
    defaults.update(kwargs)
    return SubscriptionResponse(**defaults)


def _mock_payment_manager(overrides: dict | None = None) -> MagicMock:
    """Return a PaymentManager mock with fully-typed response objects."""
    mgr = MagicMock(spec=PaymentManager)

    mgr.get_products = AsyncMock(return_value=[
        ProductResponse(
            id="basic",
            name="Basic Plan",
            description="100 credits for AI-powered website generation",
            type=PaymentType.SUBSCRIPTION,
            price_cents=999,
            currency="usd",
            features=["100 credits on subscription"],
        ),
        ProductResponse(
            id="credits-100",
            name="100 Credits Pack",
            description="Add 100 credits to your balance",
            type=PaymentType.ONE_TIME,
            price_cents=999,
            currency="usd",
            features=["100 additional credits"],
        ),
    ])

    mgr.create_checkout_session = AsyncMock(return_value=CheckoutSessionResponse(
        checkout_url="https://checkout.stripe.com/test_session",
        session_id="cs_test_123",
        expires_at=_NOW + timedelta(hours=1),
    ))

    mgr.handle_successful_checkout = AsyncMock(return_value=_sub_response())

    mgr.create_customer_portal_session = AsyncMock(return_value=CustomerPortalResponse(
        portal_url="https://billing.stripe.com/test_portal",
        expires_at=_NOW + timedelta(hours=1),
    ))

    mgr.cancel_subscription = AsyncMock(return_value=_sub_response(
        status=SubscriptionStatus.CANCELED,
        cancel_at_period_end=False,
    ))

    if overrides:
        for attr, val in overrides.items():
            setattr(mgr, attr, val)
    return mgr


class _AuthenticatedClient:
    """Context manager: overrides auth + payment dependencies, yields TestClient."""

    def __init__(self, payment_manager_mock=None, current_user: CurrentUserResponse | None = None):
        self._pmm = payment_manager_mock or _mock_payment_manager()
        self._user = current_user or _make_current_user()

    def __enter__(self) -> TestClient:
        app.dependency_overrides[get_current_user] = lambda: self._user
        app.dependency_overrides[get_payment_manager] = lambda: self._pmm
        return TestClient(app)

    def __exit__(self, *_):
        app.dependency_overrides.clear()


class _UnauthenticatedClient:
    """Context manager: overrides payment manager but NOT auth dependency."""

    def __init__(self, payment_manager_mock=None):
        self._pmm = payment_manager_mock or _mock_payment_manager()

    def __enter__(self) -> TestClient:
        app.dependency_overrides[get_payment_manager] = lambda: self._pmm
        return TestClient(app)

    def __exit__(self, *_):
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# TestGetProducts
# ---------------------------------------------------------------------------

class TestGetProducts:
    """GET /api/payments/products"""

    def test_get_products_returns_list(self):
        """Returns 200 and a list with at least one item."""
        pmm = _mock_payment_manager()
        app.dependency_overrides[get_payment_manager] = lambda: pmm
        try:
            client = TestClient(app)
            response = client.get("/api/payments/products")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_products_unauthenticated(self):
        """Products endpoint is public — 200 even with no auth token."""
        pmm = _mock_payment_manager()
        app.dependency_overrides[get_payment_manager] = lambda: pmm
        try:
            client = TestClient(app)
            # Send a request with no Authorization header
            response = client.get("/api/payments/products")
        finally:
            app.dependency_overrides.clear()

        # Products endpoint has no auth dependency, so it always returns 200
        assert response.status_code == 200


# ---------------------------------------------------------------------------
# TestCheckout
# ---------------------------------------------------------------------------

class TestCheckout:
    """POST /api/payments/checkout"""

    def test_checkout_subscription_success(self):
        """Valid subscription product_id → 200 with checkout_url."""
        with _AuthenticatedClient() as client:
            response = client.post("/api/payments/checkout", json={"product_id": "basic"})

        assert response.status_code == 200
        data = response.json()
        assert "checkout_url" in data
        assert data["checkout_url"].startswith("https://")

    def test_checkout_credit_pack_success(self):
        """Credit pack product_id → 200 with checkout_url."""
        with _AuthenticatedClient() as client:
            response = client.post("/api/payments/checkout", json={"product_id": "credits-100"})

        assert response.status_code == 200
        data = response.json()
        assert "checkout_url" in data

    def test_checkout_invalid_product_id(self):
        """Unknown product_id → 400."""
        from app.core.exceptions import InvalidProductError

        pmm = _mock_payment_manager(
            overrides={"create_checkout_session": AsyncMock(side_effect=InvalidProductError("nonexistent"))}
        )
        with _AuthenticatedClient(payment_manager_mock=pmm) as client:
            response = client.post("/api/payments/checkout", json={"product_id": "nonexistent"})

        assert response.status_code in (400, 404, 422)

    def test_checkout_unauthenticated(self):
        """No auth → 401."""
        with _UnauthenticatedClient() as client:
            response = client.post("/api/payments/checkout", json={"product_id": "basic"})

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# TestHandleSuccess
# ---------------------------------------------------------------------------

class TestHandleSuccess:
    """GET /api/payments/checkout/success?session_id=..."""

    def test_handle_success_subscription(self):
        """Valid session_id for a subscription → 200."""
        with _AuthenticatedClient() as client:
            response = client.get("/api/payments/checkout/success?session_id=cs_test_sub_123")

        assert response.status_code == 200

    def test_handle_success_credit_pack(self):
        """Valid session_id for a credit pack → 200."""
        pmm = _mock_payment_manager(
            overrides={"handle_successful_checkout": AsyncMock(return_value=MagicMock(
                id=uuid.uuid4(),
                status="succeeded",
                product_id="credits-100",
                amount=999,
                currency="USD",
                created_at=datetime.now(UTC).replace(tzinfo=None),
                updated_at=datetime.now(UTC).replace(tzinfo=None),
            ))}
        )
        with _AuthenticatedClient(payment_manager_mock=pmm) as client:
            response = client.get("/api/payments/checkout/success?session_id=cs_test_credits_123")

        assert response.status_code == 200

    def test_handle_success_invalid_session(self):
        """Invalid / missing session_id → 402 (PaymentProcessingError maps to 402)."""
        from app.core.exceptions import PaymentProcessingError

        pmm = _mock_payment_manager(
            overrides={"handle_successful_checkout": AsyncMock(
                side_effect=PaymentProcessingError("Missing required metadata in checkout session")
            )}
        )
        with _AuthenticatedClient(payment_manager_mock=pmm) as client:
            response = client.get("/api/payments/checkout/success?session_id=cs_bad_session")

        assert response.status_code in (400, 402, 422)


# ---------------------------------------------------------------------------
# TestWebhook
# ---------------------------------------------------------------------------

class TestWebhook:
    """POST /api/payments/webhook"""

    def _build_webhook_client(self, webhook_handler_mock: MagicMock) -> TestClient:
        app.dependency_overrides[get_webhook_handler] = lambda: webhook_handler_mock
        return TestClient(app)

    def _cleanup(self):
        app.dependency_overrides.clear()

    def test_webhook_subscription_created(self):
        """
        Valid subscription.created event → 200, event processed.
        Mock: WebhookHandler.handle_webhook returns a WebhookEventResponse.
        """
        from app.shared.schemas.payments.payment import WebhookEventResponse

        mock_response = WebhookEventResponse(
            event_id="evt_test_sub_created",
            event_type="customer.subscription.created",
            processed=True,
            message="Successfully processed customer.subscription.created",
        )
        mock_handler = MagicMock(spec=WebhookHandler)
        mock_handler.handle_webhook = AsyncMock(return_value=mock_response)

        client = self._build_webhook_client(mock_handler)
        try:
            response = client.post(
                "/api/payments/webhook",
                content=b'{"type": "customer.subscription.created"}',
                headers={"stripe-signature": "t=123,v1=abc"},
            )
        finally:
            self._cleanup()

        assert response.status_code == 200
        data = response.json()
        assert data["event_type"] == "customer.subscription.created"
        assert data["processed"] is True

    def test_webhook_subscription_deleted(self):
        """
        subscription.deleted event → 200, subscription marked inactive.
        """
        from app.shared.schemas.payments.payment import WebhookEventResponse

        mock_response = WebhookEventResponse(
            event_id="evt_test_sub_deleted",
            event_type="customer.subscription.deleted",
            processed=True,
            message="Successfully processed customer.subscription.deleted",
        )
        mock_handler = MagicMock(spec=WebhookHandler)
        mock_handler.handle_webhook = AsyncMock(return_value=mock_response)

        client = self._build_webhook_client(mock_handler)
        try:
            response = client.post(
                "/api/payments/webhook",
                content=b'{"type": "customer.subscription.deleted"}',
                headers={"stripe-signature": "t=456,v1=def"},
            )
        finally:
            self._cleanup()

        assert response.status_code == 200
        data = response.json()
        assert data["event_type"] == "customer.subscription.deleted"
        assert data["processed"] is True

    def test_webhook_invalid_signature(self):
        """Invalid stripe-signature header → 400."""
        from app.core.exceptions import WebhookValidationError

        mock_handler = MagicMock(spec=WebhookHandler)
        mock_handler.handle_webhook = AsyncMock(
            side_effect=WebhookValidationError("Invalid signature: No signatures found matching")
        )

        client = self._build_webhook_client(mock_handler)
        try:
            response = client.post(
                "/api/payments/webhook",
                content=b"bad_payload",
                headers={"stripe-signature": "bad_signature"},
            )
        finally:
            self._cleanup()

        assert response.status_code in (400, 422)

    def test_webhook_unhandled_event_type(self):
        """Unknown event type → 200 (graceful ignore, processed=False)."""
        from app.shared.schemas.payments.payment import WebhookEventResponse

        mock_response = WebhookEventResponse(
            event_id="evt_test_unknown",
            event_type="some.unknown.event",
            processed=False,
            message="Ignored some.unknown.event",
        )
        mock_handler = MagicMock(spec=WebhookHandler)
        mock_handler.handle_webhook = AsyncMock(return_value=mock_response)

        client = self._build_webhook_client(mock_handler)
        try:
            response = client.post(
                "/api/payments/webhook",
                content=b'{"type": "some.unknown.event"}',
                headers={"stripe-signature": "t=789,v1=ghi"},
            )
        finally:
            self._cleanup()

        assert response.status_code == 200
        data = response.json()
        assert data["processed"] is False


# ---------------------------------------------------------------------------
# TestPortal
# ---------------------------------------------------------------------------

class TestPortal:
    """POST /api/payments/portal"""

    def test_portal_success(self):
        """Authenticated user → 200 with portal_url."""
        with _AuthenticatedClient() as client:
            response = client.post("/api/payments/portal")

        assert response.status_code == 200
        data = response.json()
        assert "portal_url" in data
        assert data["portal_url"].startswith("https://")

    def test_portal_unauthenticated(self):
        """No auth → 401."""
        with _UnauthenticatedClient() as client:
            response = client.post("/api/payments/portal")

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# TestCancelSubscription
# ---------------------------------------------------------------------------

class TestCancelSubscription:
    """POST /api/payments/subscriptions/cancel"""

    def test_cancel_subscription_success(self):
        """Authenticated user with active subscription → 200."""
        with _AuthenticatedClient() as client:
            response = client.post(
                "/api/payments/subscriptions/cancel",
                json={"immediately": False},
            )

        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_cancel_no_active_subscription(self):
        """User has no subscription → 400."""
        from app.core.exceptions import SubscriptionError

        pmm = _mock_payment_manager(
            overrides={"cancel_subscription": AsyncMock(
                side_effect=SubscriptionError("No active subscription found")
            )}
        )
        with _AuthenticatedClient(payment_manager_mock=pmm) as client:
            response = client.post(
                "/api/payments/subscriptions/cancel",
                json={"immediately": False},
            )

        assert response.status_code in (400, 404)

    def test_cancel_unauthenticated(self):
        """No auth → 401."""
        with _UnauthenticatedClient() as client:
            response = client.post(
                "/api/payments/subscriptions/cancel",
                json={"immediately": False},
            )

        assert response.status_code == 401
