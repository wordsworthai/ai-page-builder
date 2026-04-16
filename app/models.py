"""
Backward-compatibility shim. All models have moved:
  Shared models  → app.shared.models
  PB models      → app.products.page_builder.models
This file is deleted in Chunk H after all direct imports are updated.
"""
from app.shared.models import (
    UUIDModelBase,
    Article,
    User,
    Purchase,
    SubscriptionStatus,
    BusinessType,
    BusinessRole,
    Subscription,
    Business,
    BusinessUser,
    BusinessCredits,
    CreditTransaction,
    ServiceBusinessProfile,
    mapper_registry,
    Base,
)
from app.products.page_builder.models import (
    Website,
    WebsitePage,
    GenerationVersion,
    PagePublishHistory,
)
__all__ = [
    "UUIDModelBase",
    "Article",
    "User",
    "Purchase",
    "SubscriptionStatus",
    "BusinessType",
    "BusinessRole",
    "Subscription",
    "Business",
    "BusinessUser",
    "BusinessCredits",
    "CreditTransaction",
    "ServiceBusinessProfile",
    "mapper_registry",
    "Base",
    "Website",
    "WebsitePage",
    "GenerationVersion",
    "PagePublishHistory",
]
