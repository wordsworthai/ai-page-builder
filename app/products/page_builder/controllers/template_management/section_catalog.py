"""
Section catalog endpoints - categories and sections for Add Section and Replace Header/Footer.

Uses orchestration's replacement_sections: body categories/sections for Add Section,
header/footer sections for Replace Header/Footer.
"""
import asyncio
import logging
from typing import List, Optional

from fastapi import APIRouter, Query

from app.products.page_builder.schemas.publishing.category import CategoryResponse
from app.products.page_builder.schemas.publishing.section import SectionMetadataResponse

from wwai_agent_orchestration.utils.landing_page_builder.template_utils import (
    get_categories_for_replacement,
    get_body_sections_for_replacement,
    get_header_sections_for_replacement,
    get_footer_sections_for_replacement,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _run_sync(fn, *args, **kwargs):
    """Run sync orchestration call in thread pool to avoid blocking."""
    return asyncio.to_thread(fn, *args, **kwargs)


@router.get("/categories", response_model=List[CategoryResponse])
async def get_catalog_categories():
    """
    Get body-only section categories for Add Section.

    Returns L0 categories that have body sections (excludes header/footer categories).
    """
    categories = await _run_sync(get_categories_for_replacement)
    return [CategoryResponse.model_validate(c.model_dump()) for c in categories]


@router.get("", response_model=List[SectionMetadataResponse])
async def get_catalog_sections(
    category_key: Optional[str] = Query(None, description="Filter body sections by category key"),
):
    """
    Get body sections for Add Section.

    Returns sections that can be inserted into the body zone.
    Optionally filtered by category_key.
    """
    sections = await _run_sync(
        get_body_sections_for_replacement,
        category_key=category_key,
    )
    return [SectionMetadataResponse.model_validate(s.model_dump()) for s in sections]


@router.get("/header", response_model=List[SectionMetadataResponse])
async def get_catalog_header_sections(
    category_key: Optional[str] = Query(None, description="Filter header sections by category key"),
):
    """
    Get header sections for Replace Header.

    Returns sections that can be used as the page header (e.g. Navigation Bar).
    """
    sections = await _run_sync(
        get_header_sections_for_replacement,
        category_key=category_key,
    )
    return [SectionMetadataResponse.model_validate(s.model_dump()) for s in sections]


@router.get("/footer", response_model=List[SectionMetadataResponse])
async def get_catalog_footer_sections(
    category_key: Optional[str] = Query(None, description="Filter footer sections by category key"),
):
    """
    Get footer sections for Replace Footer.

    Returns sections that can be used as the page footer.
    """
    sections = await _run_sync(
        get_footer_sections_for_replacement,
        category_key=category_key,
    )
    return [SectionMetadataResponse.model_validate(s.model_dump()) for s in sections]
