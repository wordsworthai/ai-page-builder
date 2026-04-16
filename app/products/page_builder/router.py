"""Page Builder router — aggregates all page-builder controllers."""
from fastapi import APIRouter

from app.products.page_builder.controllers.generation import router as generation_router
from app.products.page_builder.controllers.template_management import router as template_management_router
from app.products.page_builder.controllers.publishing.publishing import router as publishing_router
from app.products.page_builder.controllers.publishing.published_website_analytics import router as pwa_router
from app.products.page_builder.controllers.publishing.form_submissions import router as forms_router
from app.products.page_builder.controllers.media.media import router as media_router
from app.products.page_builder.controllers.media.shutterstock import router as shutterstock_router

router = APIRouter(prefix="/api")

router.include_router(generation_router)
router.include_router(template_management_router)
router.include_router(publishing_router)
router.include_router(pwa_router)
router.include_router(forms_router)
router.include_router(media_router)
router.include_router(shutterstock_router)
