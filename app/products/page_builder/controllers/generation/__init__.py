"""Generation API - page generation with AI workflows. Re-exports router."""
from fastapi import APIRouter

from app.products.page_builder.controllers.generation import (
    config,
    health,
    internal,
    regenerate,
    retry,
    section_add,
    status,
    templates,
    trigger,
)

router = APIRouter(prefix="/generations", tags=["Page Generation"])

# Include sub-routers (no prefix; routes are relative to /generations)
router.include_router(trigger.router)
router.include_router(status.router)
router.include_router(retry.router)
router.include_router(regenerate.router)
router.include_router(section_add.router)
router.include_router(templates.router)
router.include_router(internal.router)
router.include_router(config.router)
router.include_router(health.router)

__all__ = ["router"]
