"""
Provisioning service: single source for creating Website, WebsitePage, and GenerationVersion.

All creation logic for these assets lives here. Controllers, helpers, and workflow_input_utils
only call provisioning functions; they do not create Website, WebsitePage, or GenerationVersion.

Three scenarios:
  1. CREATE_SITE: Brand new site. Creates Website (if missing), homepage (if missing), GenerationVersion.
  2. REGENERATE: Same page, new version. Creates only GenerationVersion for existing page.
  3. NEW_TEMPLATE: Curated page (e.g. /about-us). Creates target page (if path doesn't exist), then GenerationVersion.
"""
import hashlib
import logging
import re
import uuid
from datetime import datetime, UTC
from typing import Any, Dict, Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.shared.config.credits import WorkflowTriggerType
from app.products.page_builder.models import GenerationVersion, Website, WebsitePage

logger = logging.getLogger(__name__)


def _generate_subdomain(business_name: str) -> str:
    """Generate subdomain from business name."""
    subdomain = business_name.lower()
    subdomain = re.sub(r"[^a-z0-9\s-]", "", subdomain)
    subdomain = re.sub(r"\s+", "-", subdomain)
    subdomain = subdomain.strip("-")[:63]
    return subdomain or "mywebsite"


async def _ensure_unique_subdomain(db: AsyncSession, subdomain: str) -> str:
    """Ensure subdomain is unique by appending number if needed."""
    original_subdomain = subdomain
    counter = 1

    while True:
        result = await db.execute(select(Website).where(Website.subdomain == subdomain))
        existing = result.scalar_one_or_none()

        if not existing:
            return subdomain

        subdomain = f"{original_subdomain}-{counter}"
        counter += 1

        if counter > 100:
            hash_suffix = hashlib.md5(
                f"{original_subdomain}{datetime.now(UTC).replace(tzinfo=None).isoformat()}".encode()
            ).hexdigest()[:8]
            return f"{original_subdomain}-{hash_suffix}"


async def provision_for_create_site(
    db: AsyncSession,
    business_id: uuid.UUID,
    business_name: str,
    website_intention: str,
) -> Dict[str, Any]:
    """
    Create site: Website (if missing), homepage (if missing), and GenerationVersion.

    Used by: trigger (POST /generations/trigger), internal load-test.
    Creates: Website, WebsitePage at "/", GenerationVersion for CREATE_SITE scope.
    Returns: dict with website_id, page_id, generation_version_id, subdomain.
    """
    result = await db.execute(select(Website).where(Website.business_id == business_id))
    website = result.scalar_one_or_none()

    if not website:
        subdomain = _generate_subdomain(business_name)
        subdomain = await _ensure_unique_subdomain(db, subdomain)

        website = Website(
            website_id=uuid.uuid4(),
            business_id=business_id,
            subdomain=subdomain,
            website_name=business_name,
            is_published=False,
            created_at=datetime.now(UTC).replace(tzinfo=None),
        )
        db.add(website)
        await db.flush()

    page_result = await db.execute(
        select(WebsitePage).where(
            WebsitePage.website_id == website.website_id,
            WebsitePage.page_path == "/",
        )
    )
    homepage = page_result.scalar_one_or_none()

    if not homepage:
        homepage = WebsitePage(
            page_id=uuid.uuid4(),
            website_id=website.website_id,
            page_path="/",
            page_title=business_name,
            description=f"{business_name} - {website_intention}",
            is_published=False,
            created_at=datetime.now(UTC).replace(tzinfo=None),
        )
        db.add(homepage)
        await db.flush()

    # Reuse an existing pending generation for this page instead of creating duplicates.
    # This prevents orphaned rows when the workflow launch fails and the user retries.
    existing_pending = await db.execute(
        select(GenerationVersion).where(
            GenerationVersion.entity_id == homepage.page_id,
            GenerationVersion.generation_scope == WorkflowTriggerType.CREATE_SITE.value,
            GenerationVersion.status == "pending",
        ).order_by(GenerationVersion.created_at.desc())
    )
    generation_version = existing_pending.scalar_one_or_none()

    if not generation_version:
        generation_version = GenerationVersion(
            generation_version_id=uuid.uuid4(),
            entity_id=homepage.page_id,
            entity_type="page",
            generation_scope=WorkflowTriggerType.CREATE_SITE.value,
            status="pending",
            created_at=datetime.now(UTC).replace(tzinfo=None),
        )
        db.add(generation_version)

    await db.commit()

    await db.refresh(website)
    await db.refresh(homepage)
    await db.refresh(generation_version)

    return {
        "website_id": website.website_id,
        "page_id": homepage.page_id,
        "generation_version_id": generation_version.generation_version_id,
        "subdomain": website.subdomain,
    }


async def resolve_or_create_target_page(
    page_path: Optional[str],
    page_title: Optional[str],
    website: Website,
    source_page: WebsitePage,
    db: AsyncSession,
) -> WebsitePage:
    """
    Resolve or create the target page for generation (new-template / curated page flow).

    If page_path is not given: return source_page (e.g. template update on homepage).
    If page_path is given: return existing page at that path, or create a new page.
    Used when applying a template to /about-us, /contact, etc.
    Creates: WebsitePage only when path doesn't exist.
    Raises: HTTPException 422 if page_path given but page_title missing.
    """
    if not page_path:
        return source_page

    if not page_title:
        raise HTTPException(
            status_code=422,
            detail="page_title is required when page_path is provided",
        )

    normalized_path = page_path.strip()
    if not normalized_path.startswith("/"):
        normalized_path = "/" + normalized_path
    if normalized_path != "/" and normalized_path.endswith("/"):
        normalized_path = normalized_path.rstrip("/")

    existing_page_result = await db.execute(
        select(WebsitePage).where(
            WebsitePage.website_id == website.website_id,
            WebsitePage.page_path == normalized_path,
        )
    )
    existing_page = existing_page_result.scalar_one_or_none()
    if existing_page:
        return existing_page

    target_page = WebsitePage(
        page_id=uuid.uuid4(),
        website_id=website.website_id,
        page_path=normalized_path,
        page_title=page_title.strip(),
        is_published=False,
        created_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db.add(target_page)
    await db.flush()
    return target_page


async def create_generation_version(
    entity_id: uuid.UUID,
    scope: str,
    db: AsyncSession,
) -> GenerationVersion:
    """
    Create and persist a new GenerationVersion for an existing page.

    Used by: regenerate (color-theme, content), new-template (use-section-ids).
    Called from regenerate and templates controllers before building workflow input.
    Creates: GenerationVersion only. scope is e.g. 'autopop_only', 'create-site'.
    Returns: created (committed, refreshed) GenerationVersion.
    """
    gen = GenerationVersion(
        generation_version_id=uuid.uuid4(),
        entity_id=entity_id,
        entity_type="page",
        generation_scope=scope,
        status="pending",
        created_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)
    return gen