import datetime
import uuid
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel
from app.shared.utils.helpers import get_utcnow


class Website(SQLModel, table=True):
    """
    Represents a published website for a business.
    One business can have one website (can update subdomain anytime).
    """
    __tablename__ = "websites"

    website_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False
    )
    business_id: uuid.UUID = Field(
        default=None,
        nullable=True,
        index=True
    )
    subdomain: str = Field(max_length=100, nullable=False, unique=True, index=True)
    website_name: str = Field(max_length=255, default=None, nullable=True)
    favicon_url: Optional[str] = Field(default=None, nullable=True)
    is_published: bool = Field(default=False, nullable=False)
    published_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    last_published_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    pages: List["WebsitePage"] = Relationship(
        back_populates="website",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"}
    )


class WebsitePage(SQLModel, table=True):
    """
    Represents individual pages within a website.
    Enhanced with publishing metadata and history tracking.
    """
    __tablename__ = "website_pages"

    page_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False
    )
    website_id: uuid.UUID = Field(
        foreign_key="websites.website_id",
        nullable=False,
        index=True
    )
    page_path: str = Field(max_length=100, nullable=False, index=True)
    page_title: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(max_length=500, default=None, nullable=True)
    is_published: bool = Field(default=False, nullable=False)
    published_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    last_published_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    last_s3_path: Optional[str] = Field(default=None, nullable=True)
    last_cloudfront_url: Optional[str] = Field(default=None, nullable=True)
    last_invalidation_id: Optional[str] = Field(default=None, nullable=True)
    publish_count: int = Field(default=0, nullable=False)
    last_edited_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    current_generation_id: Optional[uuid.UUID] = Field(default=None, nullable=True)
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)
    preview_link: Optional[str] = Field(
        default=None,
        nullable=True,
        description="S3 URL for AI-generated preview (non-CDN bucket)"
    )
    dev_task_id: Optional[str] = Field(default=None, nullable=True)

    website: Optional[Website] = Relationship(back_populates="pages")


class GenerationVersion(SQLModel, table=True):
    """
    Tracks AI-generated page versions and their status.
    Every generation attempt is recorded here for auditing and debugging.
    """
    __tablename__ = "generation_versions"

    generation_version_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False
    )
    entity_id: uuid.UUID = Field(
        foreign_key="website_pages.page_id",
        nullable=False,
        index=True,
        description="Reference to the page being generated"
    )
    entity_type: str = Field(
        default="page",
        max_length=50,
        nullable=False,
        description="Type of entity (currently only 'page')"
    )
    generation_scope: str = Field(
        default="create-site",
        max_length=50,
        nullable=False,
        description="Scope of generation (create-site, use-section-ids, regenerate-*, etc.)"
    )
    status: str = Field(
        default="pending",
        max_length=50,
        nullable=False,
        index=True,
        description="pending, processing, completed, failed"
    )
    tokens_used: Optional[int] = Field(default=None, nullable=True)
    estimated_cost_usd: Optional[float] = Field(default=None, nullable=True)
    workflow_run_id: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=255,
        description="LangGraph thread_id for debugging"
    )
    error_message: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
        index=True
    )
    completed_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    query_hash: Optional[str] = Field(default=None, nullable=True)
    preview_link: Optional[str] = Field(
        default=None,
        nullable=True,
        description="S3 URL for this version's preview"
    )


class PagePublishHistory(SQLModel, table=True):
    """
    Tracks every publishing event for debugging, analytics, and history.
    Captures complete deployment metadata.
    """
    __tablename__ = "page_publish_history"

    publish_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False
    )
    page_id: uuid.UUID = Field(
        foreign_key="website_pages.page_id",
        nullable=False,
        index=True
    )
    website_id: uuid.UUID = Field(
        foreign_key="websites.website_id",
        nullable=False,
        index=True
    )
    business_id: uuid.UUID = Field(nullable=False, index=True)
    s3_path: str = Field(nullable=False)
    cloudfront_url: str = Field(nullable=False)
    invalidation_id: Optional[str] = Field(default=None, nullable=True)
    html_version_hash: str = Field(nullable=False)
    html_size_bytes: int = Field(nullable=False)
    status: str = Field(default="success", nullable=False)
    error_message: Optional[str] = Field(default=None, nullable=True)
    published_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
        index=True
    )
