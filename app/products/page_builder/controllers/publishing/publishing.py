"""Publishing API endpoints - Complete with all endpoints & Production Features"""
import json
from uuid import UUID
from typing import Optional, List

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, UploadFile
import re

from app.products.page_builder.schemas.publishing.publishing import (
    EditorDefaultsResponse,
    PublishFromEditorResponse,
    PublishPageResponse,
    QuickPublishResponse,
    SetActiveGenerationRequest,
    SetActiveGenerationResponse,
    SubdomainCheckRequest,
    SubdomainCheckResponse,
    WebsiteListResponse,
    WebsitePageListResponse,
    WebsiteRead,
    WebsitePageRead,
)
from app.products.page_builder.services.publishing.publishing_service import PublishingService, get_publishing_service


router = APIRouter(prefix="/publishing", tags=["Publishing"])


@router.get("/editor-defaults", response_model=EditorDefaultsResponse)
async def get_editor_defaults(
    publishing_service: PublishingService = Depends(get_publishing_service)
):
    """
    Get pre-fill data for editor publish modal.
    """
    try:
        result = await publishing_service.get_editor_defaults()
        return EditorDefaultsResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/publish-from-editor", response_model=PublishFromEditorResponse)
async def publish_from_editor(
    subdomain: str = Form(..., description="Subdomain name (e.g., 'joeshvac')"),
    website_title: str = Form(..., description="Website title (e.g., 'Joe's HVAC')"),
    html_file: UploadFile = File(..., description="HTML file to upload (homepage for single-page, or fallback)"),
    description: Optional[str] = Form(None, description="Meta description (optional)"),
    favicon_file: Optional[UploadFile] = File(None, description="Favicon file (optional)"),
    cleanup_old_resources: bool = Form(True, description="Delete old S3 folder if subdomain changes"),
    page_routes: Optional[str] = Form(None, description="JSON array of page paths for multi-page publish"),
    page_html_files: Optional[List[UploadFile]] = File(None, description="HTML files per page, matching page_routes order"),
    page_titles: Optional[str] = Form(None, description="JSON array of page titles matching page_routes order"),
    publishing_service: PublishingService = Depends(get_publishing_service)
):
    """
    Unified publish endpoint for editor. Supports single-page and multi-page publishing.

    **Features:**
    - Deterministic Hashed Storage (security/obscurity).
    - Auto-Backups on Business ID.
    - Safe renaming with cleanup control.
    - Multi-page publishing: pass page_routes + page_html_files to publish all pages at once.
    """
    # Validate file type for HTML
    if not html_file.filename.endswith(('.html', '.htm')):
        raise HTTPException(status_code=400, detail="File must be HTML")
    
    # Validate favicon file type (if provided)
    if favicon_file and favicon_file.filename:
        allowed_extensions = ('.ico', '.png', '.svg', '.jpg', '.jpeg')
        if not favicon_file.filename.endswith(allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail="Favicon must be .ico, .png, .svg, .jpg, or .jpeg"
            )
    
    # Validate file size (10MB limit for HTML)
    MAX_HTML_SIZE = 10 * 1024 * 1024
    html_content = await html_file.read()
    if len(html_content) > MAX_HTML_SIZE:
        raise HTTPException(status_code=400, detail="HTML file size exceeds 10MB limit")
    await html_file.seek(0)
    
    # Validate favicon size (2MB limit)
    if favicon_file:
        MAX_FAVICON_SIZE = 2 * 1024 * 1024
        favicon_content = await favicon_file.read()
        if len(favicon_content) > MAX_FAVICON_SIZE:
            raise HTTPException(status_code=400, detail="Favicon file size exceeds 2MB limit")
        await favicon_file.seek(0)

    # Parse multi-page params
    parsed_routes: Optional[List[str]] = None
    parsed_titles: Optional[List[str]] = None

    if page_routes:
        try:
            parsed_routes = json.loads(page_routes)
            if not isinstance(parsed_routes, list) or not all(isinstance(r, str) for r in parsed_routes):
                raise HTTPException(status_code=400, detail="page_routes must be a JSON array of strings")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in page_routes")

        if not page_html_files or len(page_html_files) != len(parsed_routes):
            raise HTTPException(
                status_code=400,
                detail=f"page_html_files count ({len(page_html_files) if page_html_files else 0}) must match page_routes count ({len(parsed_routes)})"
            )

        # Validate each page HTML file size
        for i, pf in enumerate(page_html_files):
            content = await pf.read()
            if len(content) > MAX_HTML_SIZE:
                raise HTTPException(status_code=400, detail=f"Page HTML file {i} exceeds 10MB limit")
            await pf.seek(0)

        # Parse page titles
        if page_titles:
            try:
                parsed_titles = json.loads(page_titles)
                if not isinstance(parsed_titles, list) or len(parsed_titles) != len(parsed_routes):
                    parsed_titles = None
            except json.JSONDecodeError:
                parsed_titles = None

    try:
        if parsed_routes and page_html_files and len(parsed_routes) >= 1:
            # Multi-page publish flow
            result = await publishing_service.publish_from_editor(
                subdomain=subdomain,
                website_title=website_title,
                html_file=html_file,
                description=description,
                favicon_file=favicon_file,
                cleanup_old_path=cleanup_old_resources,
                page_routes=parsed_routes,
                page_html_files=page_html_files,
                page_titles=parsed_titles,
            )
        else:
            # Single-page publish flow (backwards compatible)
            result = await publishing_service.publish_from_editor(
                subdomain=subdomain,
                website_title=website_title,
                html_file=html_file,
                description=description,
                favicon_file=favicon_file,
                cleanup_old_path=cleanup_old_resources,
            )

        return PublishFromEditorResponse(
            success=True,
            message="Website published successfully",
            **result
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick-publish", response_model=QuickPublishResponse)
async def quick_publish(
    subdomain: str = Form(..., description="Subdomain name (e.g., 'abccleaning')"),
    website_title: str = Form(..., description="Website title (e.g., 'ABC Cleaning Inc.')"),
    html_file: UploadFile = File(..., description="HTML file to upload"),
    publishing_service: PublishingService = Depends(get_publishing_service)
):
    """
    Create website + homepage + publish in one call (LEGACY - use publish-from-editor instead)
    """
    if not html_file.filename.endswith(('.html', '.htm')):
        raise HTTPException(status_code=400, detail="File must be HTML")
    
    MAX_FILE_SIZE = 10 * 1024 * 1024
    content = await html_file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    await html_file.seek(0)
    
    try:
        result = await publishing_service.quick_publish(
            subdomain=subdomain,
            website_title=website_title,
            html_file=html_file
        )
        
        return QuickPublishResponse(
            success=True,
            message="Website published successfully",
            website_id=result["website_id"],
            page_id=result["page_id"],
            subdomain=result["subdomain"],
            cloudfront_url=result["cloudfront_url"],
            s3_path=result["s3_path"],
            invalidation_id=result["invalidation_id"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/publish-page", response_model=PublishPageResponse)
async def publish_page(
    page_id: UUID = Form(..., description="Page ID to publish"),
    html_file: UploadFile = File(..., description="HTML file to upload"),
    publishing_service: PublishingService = Depends(get_publishing_service)
):
    """
    Publish a specific page to S3 and CloudFront.
    """
    if not html_file.filename.endswith(('.html', '.htm')):
        raise HTTPException(status_code=400, detail="File must be HTML")
    
    MAX_FILE_SIZE = 10 * 1024 * 1024
    content = await html_file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    await html_file.seek(0)
    
    try:
        # Call the specific page publish method in service
        result = await publishing_service.publish_page(
            page_id=page_id,
            html_file=html_file
        )
        
        return PublishPageResponse(
            success=True,
            message="Page published successfully",
            page_id=page_id,
            cloudfront_url=result["cloudfront_url"],
            s3_path=result["s3_path"],
            invalidation_id=result["invalidation_id"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-subdomain", response_model=SubdomainCheckResponse)
async def check_subdomain_availability(
    request: SubdomainCheckRequest,
    publishing_service: PublishingService = Depends(get_publishing_service)
):
    """
    Check if a subdomain is available
    """
    subdomain = request.subdomain.lower().strip()
    
    if not re.match(r'^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$', subdomain):
        return SubdomainCheckResponse(
            available=False,
            subdomain=subdomain,
            message="Invalid subdomain format. Use alphanumeric and hyphens only (3-63 chars)"
        )
    
    is_available = await publishing_service.check_subdomain_availability(subdomain)
    
    if is_available:
        return SubdomainCheckResponse(
            available=True,
            subdomain=subdomain,
            message=f"Subdomain '{subdomain}' is available"
        )
    else:
        return SubdomainCheckResponse(
            available=False,
            subdomain=subdomain,
            message=f"Subdomain '{subdomain}' is already taken"
        )


@router.get("/websites", response_model=WebsiteListResponse)
async def list_user_websites(
    publishing_service: PublishingService = Depends(get_publishing_service)
):
    """
    Get all websites for the current user
    """
    websites = await publishing_service.get_user_websites()
    
    return WebsiteListResponse(
        websites=[WebsiteRead.model_validate(w) for w in websites],
        total=len(websites)
    )


@router.get("/websites/{website_id}/pages", response_model=WebsitePageListResponse)
async def list_website_pages(
    website_id: UUID,
    publishing_service: PublishingService = Depends(get_publishing_service)
):
    """
    Get all pages for a specific website
    """
    pages = await publishing_service.get_website_pages(website_id)
    
    return WebsitePageListResponse(
        pages=[WebsitePageRead.model_validate(p) for p in pages],
        total=len(pages)
    )


@router.patch(
    "/homepage/active-generation",
    response_model=SetActiveGenerationResponse,
)
async def set_homepage_active_generation(
    body: SetActiveGenerationRequest = Body(...),
    publishing_service: PublishingService = Depends(get_publishing_service),
):
    """
    Set the active generation (current_generation_id) for a page.
    If page_id is provided in the body, targets that page; otherwise defaults to homepage.
    The generation must exist in workflow_input for the user's business.

    Returns the new active generation ID, preview_link, and whether compilation is needed.
    """
    try:
        result = await publishing_service.set_active_generation(
            body.generation_version_id,
            page_id=body.page_id,
        )
        return SetActiveGenerationResponse(
            current_generation_id=result["current_generation_id"],
            preview_link=result["preview_link"],
            needs_compilation=result["needs_compilation"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to set active generation",
        )


@router.get("/health")
async def publishing_health_check():
    """Health check for publishing service"""
    return {
        "status": "healthy",
        "service": "publishing",
        "features": [
            "editor_publish",
            "hashed_storage",
            "backup_enabled",
            "safe_renaming",
            "subdomain_management"
        ]
    }