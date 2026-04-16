"""Shared schemas and helpers for template management (fetch/save)."""
import uuid
from typing import Dict, Any, Optional, List, Tuple

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.shared.schemas.auth.auth import CurrentUserResponse
from app.products.page_builder.models import GenerationVersion, WebsitePage, Website


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================


class SectionUpdate(BaseModel):
    """Template JSON update for a single section."""
    template_json_for_compiler: Dict[str, Any]


class SaveTemplateRequest(BaseModel):
    """Request to save template JSON updates."""
    section_updates: Dict[str, SectionUpdate]
    section_order: Optional[List[str]] = None  # Ordered list of section IDs
    deleted_sections: Optional[List[str]] = None  # List of deleted section IDs


# ============================================================================
# VERIFICATION HELPERS
# ============================================================================


async def _fetch_and_verify_ownership(
    generation_version_id: uuid.UUID,
    db: AsyncSession,
    current_user: CurrentUserResponse,
) -> Tuple[GenerationVersion, WebsitePage]:
    """
    Fetch generation and verify user owns it via page/website.
    Raises HTTPException on failure.
    Returns (generation, page).
    """
    generation = await db.get(GenerationVersion, generation_version_id)
    if not generation:
        raise HTTPException(404, "Generation not found")

    page = await db.get(WebsitePage, generation.entity_id)
    if not page:
        raise HTTPException(404, "Page not found")

    website = await db.get(Website, page.website_id)
    if not website:
        raise HTTPException(404, "Website not found")

    if str(website.business_id) != str(current_user.business_id):
        raise HTTPException(403, "Access denied")

    return (generation, page)


async def verify_generation_ownership(
    generation_version_id: uuid.UUID,
    db: AsyncSession,
    current_user: CurrentUserResponse,
) -> None:
    """
    Verify that the user owns the generation. Raises HTTPException on failure.
    """
    await _fetch_and_verify_ownership(generation_version_id, db, current_user)


async def verify_generation_ownership_and_get_page(
    generation_version_id: uuid.UUID,
    db: AsyncSession,
    current_user: CurrentUserResponse,
) -> Tuple[GenerationVersion, WebsitePage]:
    """
    Verify ownership and return (generation, page) for callers that need them (e.g. save).
    Raises HTTPException on failure.
    """
    return await _fetch_and_verify_ownership(
        generation_version_id, db, current_user
    )


async def verify_generation_ownership_and_get_status(
    generation_version_id: uuid.UUID,
    db: AsyncSession,
    current_user: CurrentUserResponse,
    disable_ownership_checks: bool = False,
) -> Tuple[str, str]:
    """
    Verify that the user owns the generation and return its status.

    Returns:
        Tuple of (generation_status, generation_error_message)

    Raises:
        HTTPException: If generation not found, page not found, website not found, or access denied
    """
    if disable_ownership_checks:
        return ("completed", "")

    generation, _ = await _fetch_and_verify_ownership(
        generation_version_id, db, current_user
    )
    return (generation.status or "completed", generation.error_message or "")


# ============================================================================
# PAGE TYPE AND PARENT RESOLUTION
# ============================================================================


def page_path_to_page_type(page_path: Optional[str]) -> str:
    """
    Derive page_type slug from page_path.
    Homepage ("/" or empty) -> 'homepage'; else the path slug (e.g. '/contact-us' -> 'contact-us').
    """
    if not page_path or (page_path or "").strip() == "/":
        return "homepage"
    path = (page_path or "").strip().strip("/")
    return path or "subpage"


async def resolve_parent_generation_version_id_from_page(
    page: WebsitePage,
    db: AsyncSession,
) -> Optional[str]:
    """
    Resolve parent_generation_version_id from the active homepage for the page's website.
    Returns homepage's current_generation_id, or None if page is homepage or homepage has none.
    """
    if page.page_path == "/" or page.page_path == "":
        return None
    homepage_result = await db.execute(
        select(WebsitePage).where(
            WebsitePage.website_id == page.website_id,
            WebsitePage.page_path == "/",
        )
    )
    homepage = homepage_result.scalar_one_or_none()
    if homepage and homepage.current_generation_id:
        return str(homepage.current_generation_id)
    return None


async def resolve_parent_generation_version_id(
    generation_version_id: uuid.UUID,
    db: AsyncSession,
    current_user: CurrentUserResponse,
) -> Optional[str]:
    """
    Resolve parent_generation_version_id from the active homepage for this business.
    Never use MongoDB doc/sections_doc for this—always derive from DB.
    Returns homepage's current_generation_id for the same website, or None if homepage or not applicable.
    """
    generation, page = await _fetch_and_verify_ownership(
        generation_version_id, db, current_user
    )
    return await resolve_parent_generation_version_id_from_page(page, db)
