"""
Page Builder product definitions.

This module owns all page_builder plan configurations and registers them with
the shared payment_config at startup. Fulfillment data (credits_granted,
plan_type, is_credit_pack) lives here so payment_manager and webhook_handler
remain product-agnostic.
"""

from app.shared.config.payments import PaymentSettings, ProductConfig, payment_config

_settings = PaymentSettings()

PAGE_BUILDER_PRODUCTS: dict[str, ProductConfig] = {
    "basic": ProductConfig(
        id="basic",
        name="Basic Plan",
        description="100 credits for AI-powered website generation",
        stripe_price_id=_settings.stripe_price_pb_basic,
        type="subscription",
        price_cents=999,
        currency="usd",
        trial_period_days=None,
        features=[
            "100 credits on subscription",
            "Buy additional credit packs",
            "All generation features",
            "Website publishing",
            "Unlimited edits",
            "Priority support",
        ],
        credits_granted=100,
        plan_type="BASIC",
    ),
    "credits-100": ProductConfig(
        id="credits-100",
        name="100 Credits Pack",
        description="Add 100 credits to your balance",
        stripe_price_id=_settings.stripe_price_pb_credits_100,
        type="one_time",
        price_cents=999,
        currency="usd",
        features=[
            "100 additional credits",
            "Never expires",
            "Use for any generation",
        ],
        credits_granted=100,
        is_credit_pack=True,
    ),
}


def register() -> None:
    """Register page_builder products with the shared payment config."""
    payment_config.register_products(PAGE_BUILDER_PRODUCTS)
