"""Pydantic schemas for publishing endpoints"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer


# ===== Website Schemas =====

class WebsiteBase(BaseModel):
    subdomain: str = Field(..., max_length=100, description="Subdomain for the website")


class WebsiteCreate(WebsiteBase):
    pass


class WebsiteRead(WebsiteBase):
    website_id: UUID
    business_id: UUID
    website_name: str
    favicon_url: Optional[str]
    is_published: bool
    published_at: Optional[datetime]
    last_published_at: Optional[datetime]
    created_at: datetime
    
    @field_serializer('published_at', 'last_published_at', 'created_at')
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        """Serialize UTC datetime to ISO format with 'Z' suffix."""
        if dt is None:
            return None
        # If datetime is naive (no timezone), assume it's UTC and add 'Z'
        if dt.tzinfo is None:
            return dt.isoformat() + 'Z'
        # If datetime has timezone, convert to UTC and add 'Z'
        return dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat() + 'Z'
    
    class Config:
        from_attributes = True


class WebsiteWithPages(WebsiteRead):
    pages: list["WebsitePageRead"]


# ===== Website Page Schemas =====

class WebsitePageBase(BaseModel):
    page_path: str = Field(..., max_length=100, description="Path for the page (e.g., '/', '/menu')")
    page_title: str = Field(..., max_length=255, description="Title of the page")
    description: Optional[str] = Field(None, max_length=500, description="Page meta description")


class WebsitePageCreate(WebsitePageBase):
    website_id: UUID


class WebsitePageRead(WebsitePageBase):
    page_id: UUID
    website_id: UUID
    is_published: bool
    published_at: Optional[datetime]
    last_published_at: Optional[datetime]
    last_s3_path: Optional[str]
    last_cloudfront_url: Optional[str]
    last_invalidation_id: Optional[str]
    publish_count: int
    last_edited_at: Optional[datetime]
    created_at: datetime
    preview_link: Optional[str] = None
    dev_task_id: Optional[str] = None
    current_generation_id: Optional[UUID] = None 
    
    @field_serializer('published_at', 'last_published_at', 'last_edited_at', 'created_at')
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        """Serialize UTC datetime to ISO format with 'Z' suffix."""
        if dt is None:
            return None
        # If datetime is naive (no timezone), assume it's UTC and add 'Z'
        if dt.tzinfo is None:
            return dt.isoformat() + 'Z'
        # If datetime has timezone, convert to UTC and add 'Z'
        return dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat() + 'Z'
    
    class Config:
        from_attributes = True


# ===== Publishing Response Schemas =====

class PublishPageResponse(BaseModel):
    success: bool
    message: str
    page_id: UUID
    cloudfront_url: str
    s3_path: str
    invalidation_id: Optional[str] = None


class SubdomainCheckRequest(BaseModel):
    subdomain: str = Field(..., max_length=100)


class SubdomainCheckResponse(BaseModel):
    available: bool
    subdomain: str
    message: str


class WebsiteListResponse(BaseModel):
    websites: list[WebsiteRead]
    total: int


class WebsitePageListResponse(BaseModel):
    pages: list[WebsitePageRead]
    total: int


class SetActiveGenerationRequest(BaseModel):
    """Request body for PATCH /publishing/homepage/active-generation"""
    generation_version_id: UUID = Field(..., description="Generation version ID to set as active")
    page_id: Optional[UUID] = Field(None, description="Page ID to set active generation for. If not provided, defaults to homepage.")


class SetActiveGenerationResponse(BaseModel):
    """Response for PATCH /publishing/homepage/active-generation"""
    current_generation_id: UUID = Field(..., description="Updated active generation ID on homepage")
    preview_link: Optional[str] = Field(None, description="Preview link for the active version")
    needs_compilation: bool = Field(False, description="True if the version needs to be compiled (no cached preview)")


# ===== Quick Publish Schema =====

class QuickPublishResponse(BaseModel):
    success: bool
    message: str
    website_id: UUID
    page_id: UUID
    subdomain: str
    cloudfront_url: str
    s3_path: str
    invalidation_id: Optional[str] = None


# ===== Editor-Specific Schemas =====

class HomepageInfo(BaseModel):
    """Homepage details for editor defaults"""
    page_id: str
    page_title: str
    description: Optional[str]
    last_published_at: Optional[datetime]
    publish_count: int
    
    @field_serializer('last_published_at')
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        """Serialize UTC datetime to ISO format with 'Z' suffix."""
        if dt is None:
            return None
        # If datetime is naive (no timezone), assume it's UTC and add 'Z'
        if dt.tzinfo is None:
            return dt.isoformat() + 'Z'
        # If datetime has timezone, convert to UTC and add 'Z'
        return dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat() + 'Z'


class ExistingWebsiteInfo(BaseModel):
    """Existing website information for editor pre-fill"""
    website_id: str
    subdomain: str
    website_name: str
    is_published: bool
    published_at: Optional[datetime]
    live_url: Optional[str]
    homepage: HomepageInfo
    
    @field_serializer('published_at')
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        """Serialize UTC datetime to ISO format with 'Z' suffix."""
        if dt is None:
            return None
        # If datetime is naive (no timezone), assume it's UTC and add 'Z'
        if dt.tzinfo is None:
            return dt.isoformat() + 'Z'
        # If datetime has timezone, convert to UTC and add 'Z'
        return dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat() + 'Z'


class EditorDefaultsResponse(BaseModel):
    """
    Response for editor publish modal pre-fill data.
    Includes business info and existing website (if any).
    """
    business_name: str
    suggested_subdomain: str
    existing_website: Optional[ExistingWebsiteInfo] = None


class PublishFromEditorResponse(BaseModel):
    """Response for publishing from editor"""
    success: bool
    message: str
    website_id: str
    page_id: str
    subdomain: str
    cloudfront_url: str
    s3_path: str
    invalidation_id: Optional[str]
    is_new_website: bool  # True if created new, False if updated existing
    subdomain_changed: bool  # True if subdomain was changed
    pages_published: int = 1  # Number of pages published (1 for single-page backwards compat)


# ===== Publish History Schemas =====

class PagePublishHistoryRead(BaseModel):
    """Single publish history entry"""
    publish_id: UUID
    page_id: UUID
    website_id: UUID
    business_id: UUID
    s3_path: str
    cloudfront_url: str
    invalidation_id: Optional[str]
    html_version_hash: str
    html_size_bytes: int
    status: str
    error_message: Optional[str]
    published_at: datetime
    
    @field_serializer('published_at')
    def serialize_datetime(self, dt: datetime) -> str:
        """Serialize UTC datetime to ISO format with 'Z' suffix."""
        # If datetime is naive (no timezone), assume it's UTC and add 'Z'
        if dt.tzinfo is None:
            return dt.isoformat() + 'Z'
        # If datetime has timezone, convert to UTC and add 'Z'
        return dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat() + 'Z'
    
    class Config:
        from_attributes = True


class PublishHistoryListResponse(BaseModel):
    """List of publish history entries"""
    history: list[PagePublishHistoryRead]
    total: int