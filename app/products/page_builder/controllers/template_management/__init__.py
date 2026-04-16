"""Template management API - fetch, save, section template compilation, curated pages, browse."""
from fastapi import APIRouter

from app.products.page_builder.controllers.template_management import (
    browse_templates,
    curated,
    fetch,
    save,
    section_catalog,
    sections,
)

router = APIRouter(prefix="/templates", tags=["Templates"])
# Static paths first so they match before /{generation_version_id}
router.include_router(curated.router)
router.include_router(browse_templates.router)
router.include_router(fetch.router)
router.include_router(save.router)
# Section catalog (categories, body/header/footer sections) - before sections router so /catalog/* matches first
router.include_router(section_catalog.router, prefix="/sections/catalog", tags=["Section catalog"])
router.include_router(sections.router, prefix="/sections", tags=["Section templates"])

__all__ = ["router"]
