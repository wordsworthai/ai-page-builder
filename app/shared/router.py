"""Shared router — aggregates all product-agnostic controllers."""
from fastapi import APIRouter

from app.shared.controllers.auth.auth import auth_router
from app.shared.controllers.articles.article import article_router
from app.shared.controllers.payments.payments import payments_router
from app.shared.controllers.payments.plans import plans_router
from app.shared.controllers.analytics.analytics import analytics_router
from app.shared.controllers.integrations.integrations import integrations_router
from app.shared.controllers.payments.upgrades import upgrades_router
from app.shared.controllers.support.contact_support import router as contact_support_router
from app.shared.controllers.payments.credits import router as credits_router
from app.shared.controllers.analytics.product_analytics import product_analytics_router
from app.shared.controllers.connectors.nango import nango_router

router = APIRouter()

router.include_router(auth_router, prefix="/api/auth", tags=["auth"])
router.include_router(article_router, prefix="/api/articles", tags=["articles"])
router.include_router(payments_router, prefix="/api/payments", tags=["payments"])
router.include_router(plans_router)
router.include_router(analytics_router)
router.include_router(integrations_router)
router.include_router(upgrades_router)
router.include_router(contact_support_router, prefix="/api")
router.include_router(credits_router)
router.include_router(product_analytics_router)
router.include_router(nango_router)
