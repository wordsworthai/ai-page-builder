"""Media schemas for upload API requests and responses."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# =============================================================================
# EXISTING SCHEMAS (unchanged)
# =============================================================================

class PreviewImage(BaseModel):
    """Preview image for video thumbnails."""
    url: str
    width: int
    height: int


class VideoSource(BaseModel):
    """Video source format information."""
    format: str
    mime_type: str
    url: str
    width: int
    height: int


class ImageData(BaseModel):
    """Image-specific data nested under 'image' field."""
    src: Optional[str] = None
    asset_path: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    aspect_ratio: Optional[float] = None
    alt: Optional[str] = None
    id: Optional[str] = None


class VideoData(BaseModel):
    """Video-specific data nested under 'video' field."""
    asset_path: Optional[str] = None
    filename: Optional[str] = None
    aspect_ratio: Optional[float] = None
    alt: Optional[str] = None
    id: Optional[str] = None
    preview_image: Optional[PreviewImage] = None
    sources: Optional[List[VideoSource]] = None


class AutopopulationMetadata(BaseModel):
    """Metadata for autopopulation and filtering."""
    media_extension: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    media_tags: Optional[List[str]] = Field(default_factory=list)


class StockMediaData(BaseModel):
    """Stock media data."""
    id: str
    stock_provider: str
    search_query: Dict
    query_hash: str
    api_response: Dict
    created_at: datetime
    updated_at: datetime


class MediaDocument(BaseModel):
    """Full media document as stored in MongoDB."""
    id: str = Field(..., alias="_id")
    business_id: str
    size: int

    source: str = "upload"
    trade_type: Optional[str] = ""
    trade_type_search_query: Optional[str] = ""

    stock_media_id: Optional[str] = None
    media_type: str
    
    image: Optional[ImageData] = None
    video: Optional[VideoData] = None
    
    autopopulation_metadata: Optional[AutopopulationMetadata] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True


class IngestStockRequest(BaseModel):
    """Request schema for stock ingestion"""
    search_query: str = Field(..., description="Search query used to find this stock media")
    business_id: Optional[str] = Field(None, description="Business ID (optional for generic stock)")
    trade_type: Optional[str] = Field(None, description="Trade type for generic stock media")


class BulkIngestStockRequest(BaseModel):
    """Request schema for bulk stock ingestion by query."""
    query: str = Field(..., description="Search query for Shutterstock")
    trade_type: str = Field(..., description="Trade type (e.g., 'plumbing', 'hvac')")
    media_type: str = Field("image", description="Media type: 'image' or 'video'")
    limit: int = Field(15, ge=1, le=50, description="Number of results to ingest (default: 15)")


# =============================================================================
# BATCH GENERATION SCHEMAS (NEW)
# =============================================================================

class BatchJobInfo(BaseModel):
    """Info about a single batch job for one aspect ratio"""
    batch_job_name: str
    prompts: List[str]
    prompt_count: int
    status: str = "pending"  # pending, succeeded, failed, processed
    submitted_at: Optional[str] = None
    completed_at: Optional[str] = None
    processed_at: Optional[str] = None
    results: Optional[Dict[str, Any]] = None


class BatchSubmitRequest(BaseModel):
    """Request to submit batches for a trade"""
    trade_type: str = Field(..., description="Trade type to process")
    org_id: str = Field(..., description="Organization ID for S3 path")
    style_modifier: str = Field(
        "Hyper-realistic photograph, shot on 35mm lens, professional lighting, shallow depth of field, natural colors, sharp focus",
        description="Style modifier prepended to each prompt"
    )
    image_size: str = Field("2K", description="Output resolution: 1K, 2K, 4K")
    model: str = Field("gemini-3-pro-image-preview", description="Gemini model to use")
    

class BatchSubmitResponse(BaseModel):
    """Response from batch submission"""
    success: bool
    trade_type: str
    message: str
    batches_submitted: int
    batch_jobs: Dict[str, BatchJobInfo] = Field(default_factory=dict)


class BatchStatusResponse(BaseModel):
    """Status of all batches for a trade"""
    trade_type: str
    status: str  # ready, batches_submitted, batches_complete, generated
    total_batches: int
    pending: int
    succeeded: int
    failed: int
    processed: int
    batch_jobs: Dict[str, Dict] = Field(default_factory=dict)


class BatchPollResponse(BaseModel):
    """Response from polling all batches"""
    success: bool
    message: str
    total_trades: int
    trades_complete: int
    trades_pending: int
    details: List[BatchStatusResponse] = Field(default_factory=list)


class BatchProcessRequest(BaseModel):
    """Request to process completed batches for a trade"""
    trade_type: str = Field(..., description="Trade type to process")
    org_id: str = Field(..., description="Organization ID for S3 path")


class BatchProcessResponse(BaseModel):
    """Response from processing completed batches"""
    success: bool
    trade_type: str
    message: str
    skipped: bool = False  # ADD: for "already processed" cases
    total_images: int = 0  # ADD default
    uploaded_count: int = 0  # ADD default
    inserted_count: int = 0  # ADD default
    skipped_count: int = 0  # ADD: new field
    failed_count: int = 0  # ADD default
    errors: List[Dict] = Field(default_factory=list)

# =============================================================================
# LEGACY SCHEMAS (For backward compatibility)
# =============================================================================

class GenerateAndIngestRequest(BaseModel):
    """Request for AI image generation and ingestion (legacy blocking mode)"""
    prompts: List[str] = Field(..., description="List of prompts for image generation")
    trade_type: str = Field(..., description="Trade type (e.g., 'plumbing', 'hvac')")
    org_id: str = Field(..., description="Organization ID for S3 path")
    category: Optional[str] = Field(None, description="Optional category for the images")
    style_modifier: str = Field(
        "Hyper-realistic photograph, shot on 35mm lens, professional lighting, shallow depth of field, natural colors, sharp focus",
        description="Style modifier prepended to each prompt"
    )
    aspect_ratio: str = Field(
        "16:9",
        description="Image aspect ratio. Options: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 4:5, 5:4, 21:9"
    )
    image_size: str = Field(
        "2K",
        description="Output resolution. Options: 1K, 2K, 4K"
    )
    model: str = Field(
        "gemini-3-pro-image-preview",
        description="Gemini model. Options: gemini-2.5-flash-image, gemini-3-pro-image-preview"
    )
    use_realtime: bool = Field(
        False,
        description=(
            "If True, uses Real-time API (immediate, but 2x cost). "
            "If False (default), uses Batch API (50% cheaper, same quality). "
            "Both support aspect_ratio and image_size with gemini-3-pro-image-preview."
        )
    )


class GenerateAndIngestResponse(BaseModel):
    """Response from AI image generation (legacy)"""
    success: bool
    batch_job_name: Optional[str] = None
    total_prompts: int
    message: str
    api_mode: str = Field("batch", description="API mode used: 'batch' or 'realtime'")
    job_state: Optional[str] = None
    uploaded_count: Optional[int] = 0
    inserted_count: Optional[int] = 0
    failed_count: Optional[int] = 0
    errors: Optional[List[dict]] = []





# =============================================================================
# variation trades
# =============================================================================

class VariationInfo(BaseModel):
    """Info about a single image variation."""
    src: str
    width: int
    height: int
    asset_path: str
    size: int
    scale_factor: float


class PostprocessRequest(BaseModel):
    """Request to post-process variations for a trade."""
    trade_type: str = Field(..., description="Trade type to process")
    batch_size: int = Field(50, ge=1, le=200, description="Number of images to process per call")


class PostprocessResponse(BaseModel):
    """Response from post-processing."""
    success: bool
    trade_type: str
    status: str = "processing"
    message: str
    processed: int = 0
    failed: int = 0
    remaining: int = 0
    errors: Optional[List[Dict]] = None


class PostprocessStatusResponse(BaseModel):
    """Status of post-processing for trades."""
    success: bool
    message: Optional[str] = None
    # Single trade fields
    trade_type: Optional[str] = None
    postprocess_status: Optional[str] = None
    total_images: Optional[int] = None
    processed_images: Optional[int] = None
    remaining: Optional[int] = None
    progress_percent: Optional[float] = None
    # Multi-trade fields
    trades: Optional[List[Dict]] = None
    total_trades: Optional[int] = None
    summary: Optional[Dict] = None


# =============================================================================
# SLOT-SPECIFIC MEDIA RECOMMENDATIONS
# =============================================================================

class SlotMediaMatchRequest(BaseModel):
    """Request for slot-specific media recommendations."""
    element_id: Optional[str] = Field(None, description="Element ID within the section")
    block_type: Optional[str] = Field(None, description="Type of block containing the slot (e.g., 'hero', 'gallery')")
    block_index: Optional[int] = Field(None, description="Index of block within section (0-based)")
    section_id: Optional[str] = Field(None, description="Identifier of the section containing the slot")
    width: int = Field(gt=0, description="Required width in pixels")
    height: int = Field(gt=0, description="Required height in pixels")
    retrieval_sources: Optional[List[str]] = Field(
        default=["generated", "google_maps"],
        description="List of sources to fetch from: generated, google_maps, stock"
    )
    max_recommendations: int = Field(
        default=10,
        ge=1,
        description="Maximum number of recommendations to return (default: 10, will be limited to available images)"
    )
    media_type: Optional[str] = Field(
        default="image",
        description="Type of media to match: 'image' or 'video' (default: 'image')"
    )


# =============================================================================
# BUSINESS IMAGES
# =============================================================================

class BusinessImageItem(BaseModel):
    """Single business image item (logo, review photo, or Google photo)."""
    _id: str
    business_id: str
    source: str  # "logo", "review_photo", "google_photo"
    media_type: str = "image"
    size: int = 0
    image: ImageData
    created_at: str
    updated_at: str


class BusinessImagesResponse(BaseModel):
    """Response for business images endpoint."""
    success: bool = True
    logo: List[BusinessImageItem] = Field(default_factory=list)
    reviews: List[BusinessImageItem] = Field(default_factory=list)
    google_photos: List[BusinessImageItem] = Field(default_factory=list)