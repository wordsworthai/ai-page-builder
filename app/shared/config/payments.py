import os
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class StripeConfig(BaseModel):
    """Stripe configuration with validation"""

    api_key: str = Field(..., description="Stripe secret API key")
    publishable_key: str = Field(..., description="Stripe publishable key")
    webhook_secret: str = Field(..., description="Stripe webhook endpoint secret")

    @field_validator("api_key")
    def validate_api_key(cls, v):
        # Allow placeholder values during development setup
        if not v or v == "" or v.endswith("_not_configured"):
            return v
        if not v.startswith(("sk_test_", "sk_live_")):
            raise ValueError("Invalid Stripe API key format")
        return v

    @field_validator("publishable_key")
    def validate_publishable_key(cls, v):
        # Allow placeholder values during development setup
        if not v or v == "" or v.endswith("_not_configured"):
            return v
        if not v.startswith(("pk_test_", "pk_live_")):
            raise ValueError("Invalid Stripe publishable key format")
        return v


class ProductConfig(BaseModel):
    """Product configuration for payment integration"""

    id: str = Field(..., description="Product identifier")
    name: str = Field(..., description="Product display name")
    description: str = Field(..., description="Product description")
    stripe_price_id: str = Field(..., description="Stripe price ID")
    type: str = Field(..., description="Product type: 'subscription' or 'one_time'")
    price_cents: int = Field(..., description="Price in cents")
    currency: str = Field(default="usd", description="Currency code")
    trial_period_days: Optional[int] = Field(
        default=None, description="Trial period for subscriptions"
    )
    features: list[str] = Field(default_factory=list, description="Product features")
    metadata: Dict[str, str] = Field(
        default_factory=dict, description="Additional metadata"
    )
    # Fulfillment fields — drive what happens after a successful payment
    credits_granted: int = Field(
        default=0, description="Credits to grant on successful purchase"
    )
    plan_type: Optional[str] = Field(
        default=None, description="PlanType value to set on purchase (e.g. 'BASIC')"
    )
    is_credit_pack: bool = Field(
        default=False, description="True for one-time credit top-up products"
    )

    @field_validator("stripe_price_id")
    def validate_price_id(cls, v):
        # Allow placeholder values
        if v.startswith("price_") and v.endswith("_placeholder"):
            return v
        if not v.startswith("price_"):
            raise ValueError("Invalid Stripe price ID format")
        return v

    @field_validator("type")
    def validate_type(cls, v):
        if v not in ["subscription", "one_time"]:
            raise ValueError('Product type must be "subscription" or "one_time"')
        return v

    @field_validator("price_cents")
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v


def _get_env_files() -> List[str]:
    """Get environment files to load (same as base config)"""
    env_file = os.environ.get("ENV_FILE")
    if env_file:
        return [env_file]
    return ["local.env", ".env"]


class PaymentSettings(BaseSettings):
    """Payment settings with automatic environment loading"""
    
    model_config = SettingsConfigDict(
        env_file=_get_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # Stripe configuration - loaded from environment
    stripe_secret_key: str = Field(
        default="sk_test_placeholder_key_not_configured",
        description="Stripe secret API key"
    )
    stripe_publishable_key: str = Field(
        default="pk_test_placeholder_key_not_configured", 
        description="Stripe publishable key"
    )
    stripe_webhook_secret: str = Field(
        default="whsec_placeholder_not_configured",
        description="Stripe webhook secret"
    )
    
    # Page Builder product price IDs
    stripe_price_pb_basic: str = Field(
        default="price_pb_basic_placeholder",
        description="Page Builder basic plan monthly subscription price ID ($9.99/mo)"
    )
    stripe_price_pb_credits_100: str = Field(
        default="price_pb_credits_100_placeholder",
        description="Page Builder 100 credits pack price ID ($9.99)"
    )

    # Construction Proposal product price IDs
    stripe_price_cp_basic: str = Field(
        default="price_cp_basic_placeholder",
        description="Construction Proposal basic plan monthly subscription price ID ($19.90/mo)"
    )

    # Deprecated — replaced by stripe_price_pb_* equivalents above
    stripe_price_basic: str = Field(
        default="price_basic_placeholder",
        description="[DEPRECATED] Use stripe_price_pb_basic"
    )
    stripe_price_credits_100: str = Field(
        default="price_credits_100_placeholder",
        description="[DEPRECATED] Use stripe_price_pb_credits_100"
    )
    
    # Legacy price IDs - kept for backward compatibility during migration
    stripe_price_starter: str = Field(
        default="price_starter_placeholder",
        description="[DEPRECATED] Starter plan price ID"
    )
    stripe_price_pro: str = Field(
        default="price_pro_placeholder",
        description="[DEPRECATED] Pro plan price ID"
    )
    stripe_price_premium_sub: str = Field(
        default="price_premium_sub_placeholder",
        description="[DEPRECATED] Premium subscription price ID"
    )
    stripe_price_enterprise_sub: str = Field(
        default="price_enterprise_sub_placeholder",
        description="[DEPRECATED] Enterprise subscription price ID"
    )
    stripe_price_starter_monthly: str = Field(
        default="price_starter_monthly_placeholder",
        description="[DEPRECATED] Starter plan monthly subscription price ID"
    )
    stripe_price_starter_yearly: str = Field(
        default="price_starter_yearly_placeholder",
        description="[DEPRECATED] Starter plan yearly subscription price ID"
    )
    
    # Domain configuration
    domain: str = Field(
        default="http://localhost:5173",
        description="Application domain"
    )


class PaymentConfig(BaseModel):
    """Main payment configuration - streamlined for production use"""

    domain: str = Field(..., description="Application domain")
    stripe: StripeConfig
    products: Dict[str, ProductConfig] = Field(default_factory=dict)
    success_url_template: str = Field(
        default="/dashboard/payment/success?session_id={session_id}"
    )
    cancel_url: str = Field(default="/dashboard")

    def register_products(self, products: Dict[str, "ProductConfig"]) -> None:
        """Called at startup by each product module to register its plans."""
        self.products.update(products)


def load_payment_config() -> PaymentConfig:
    """Load payment configuration from environment variables - simplified"""
    
    # Load settings using pydantic-settings (automatically loads from local.env)
    settings = PaymentSettings()

    # Create Stripe configuration
    stripe_config = StripeConfig(
        api_key=settings.stripe_secret_key,
        publishable_key=settings.stripe_publishable_key,
        webhook_secret=settings.stripe_webhook_secret,
    )

    # Create payment configuration
    config = PaymentConfig(
        domain=settings.domain,
        stripe=stripe_config,
    )

    return config


# Global payment configuration instance
# Products are registered at startup by each product module (e.g. page_builder/config/plans.py)
payment_config = load_payment_config()
