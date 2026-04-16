"""
Pydantic schemas for generation tracking API.

SIMPLIFIED: Removed phase, parallel_group, parallel_key from NodeExecutionEntry.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
import uuid


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class GeneratePageRequest(BaseModel):
    """Request to trigger page generation"""
    
    business_name: str = Field(..., min_length=1, max_length=200, description="Business name")
    website_intention: str = Field(..., description="Website goal (e.g., 'generate_leads')")
    website_tone: str = Field(..., description="Website tone (e.g., 'professional')")
    color_palette_id: Optional[str] = Field(None, description="Color palette ID (e.g., 'palette_blue_modern')")
    google_places_data: Optional[dict] = Field(None, description="Google Places API data")
    yelp_url: Optional[str] = Field(None, description="Yelp business URL")
    query: Optional[str] = Field(None, description="Additional context")
    palette: Optional[dict] = Field(None, description="Color palette")
    font_family: Optional[str] = Field(None, description="Font family")
    
    class Config:
        json_schema_extra = {
            "example": {
                "business_name": "Joe's HVAC",
                "website_intention": "generate_leads",
                "website_tone": "professional",
            }
        }


class CompilePreviewRequest(BaseModel):
    """Request to compile and upload preview HTML"""
    generation_version_id: uuid.UUID = Field(..., description="Generation version ID")
    html_content: str = Field(..., min_length=1, description="Full page HTML content")


class GenerationCallbackRequest(BaseModel):
    """Internal callback from landing page workflow. Accepts request_id (orchestration) or generation_version_id (legacy)."""
    generation_version_id: Optional[uuid.UUID] = None
    request_id: Optional[str] = Field(None, description="Orchestration sends this; mapped to generation_version_id")
    status: str = Field(..., description="completed or failed")
    tokens_used: Optional[int] = None
    estimated_cost_usd: Optional[float] = None
    error_message: Optional[str] = None
    result: Optional[dict] = Field(None, description="Orchestration sends result; alias for landing_page_output")
    # Per-generation node-update delivery metrics (from orchestration)
    node_updates_attempted: Optional[int] = None
    node_updates_failed: Optional[int] = None
    node_updates_failed_reasons: Optional[dict] = Field(None, description="Error type name -> count")
    node_delivery_attempts: Optional[List[dict]] = Field(None, description="Per-node attempt: node_name, status, duration_ms, error_type")

    def get_generation_version_id(self) -> uuid.UUID:
        """Resolve generation_version_id from request_id or generation_version_id."""
        if self.generation_version_id is not None:
            return self.generation_version_id
        if self.request_id:
            return uuid.UUID(self.request_id)
        raise ValueError("Either generation_version_id or request_id must be provided")


class NodeUpdatePayload(BaseModel):
    """Payload sent to node_update_url webhook by orchestration service."""
    request_id: str
    node_name: str
    display_name: str
    status: str = "completed"
    output_summary: Optional[str] = None
    output_type: str = "text"
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: Optional[int] = None


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class GeneratePageResponse(BaseModel):
    """Response from generation trigger"""
    generation_version_id: uuid.UUID
    page_id: uuid.UUID
    website_id: uuid.UUID
    subdomain: str
    status: str
    message: str = "Generation started successfully"


class TriggerLoadTestRequest(BaseModel):
    """Request for internal load-test trigger (no request_id/callback_url; backend sets those)."""
    business_name: str = Field(..., min_length=1, max_length=200, description="Business name")
    website_intention: str = Field(..., description="Website goal (e.g., 'generate_leads')")
    website_tone: str = Field(..., description="Website tone (e.g., 'professional')")
    query: Optional[str] = Field(None, description="Additional context")
    yelp_url: Optional[str] = Field(None, description="Yelp business URL")
    palette: Optional[dict] = Field(None, description="Color palette")
    font_family: Optional[str] = Field(None, description="Font family")
    enable_streaming: bool = Field(
        True,
        description="If False, node-update webhooks are not sent; useful for stress testing without Redis streaming.",
    )


class TriggerLoadTestResponse(BaseModel):
    """Response from load-test trigger."""
    generation_version_id: uuid.UUID
    status: str = "started"
    message: str = "Load test generation started"


# ============================================================================
# NODE EXECUTION ENTRY (SIMPLIFIED)
# ============================================================================

class NodeExecutionEntry(BaseModel):
    """
    Single node execution entry for streaming progress UI.
    
    SIMPLIFIED: Removed phase, parallel_group, parallel_key.
    UPDATED: Added output_type for HTML rendering support.
    """
    node_name: str = Field(..., description="Internal node identifier")
    display_name: str = Field(..., description="Human-readable name")
    status: str = Field("completed", description="Node status: completed, failed")
    output_summary: Optional[str] = Field(None, description="Formatted output for UI (if show_output=True)")
    output_type: Optional[str] = Field("text", description="Output format: 'text' or 'html'")
    started_at: Optional[str] = Field(None, description="ISO timestamp when node started")
    completed_at: Optional[str] = Field(None, description="ISO timestamp when node completed")
    duration_ms: Optional[int] = Field(None, description="Node execution duration in milliseconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "node_name": "campaign_intent_synthesizer",
                "display_name": "Understanding your business",
                "status": "completed",
                "output_summary": "<p class=\"text-sm\">Professional café targeting local customers...</p>",
                "output_type": "html",
                "completed_at": "2025-01-16T10:30:45Z",
                "duration_ms": 2340,
            }
        }


# ============================================================================
# GENERATION STATUS RESPONSE (SIMPLIFIED)
# ============================================================================

class GenerationStatusResponse(BaseModel):
    """
    Response from status polling endpoint.
    
    SIMPLIFIED: execution_log entries no longer have phase/parallel fields.
    """
    
    generation_version_id: uuid.UUID
    status: str = Field(..., description="pending, processing, completed, failed")
    
    # Timing
    started_at: Optional[datetime] = Field(None, description="When generation started")
    elapsed_seconds: int = Field(0, description="Seconds elapsed since start")
    
    # Current state
    current_node: Optional[str] = Field(None, description="Current node name (internal)")
    current_node_display: Optional[str] = Field(None, description="Current node display name")
    nodes_completed: int = Field(0, description="Number of nodes completed")
    
    # Execution log
    execution_log: List[NodeExecutionEntry] = Field(
        default_factory=list,
        description="Ordered list of completed node executions"
    )
    
    # Result
    preview_link: Optional[str] = Field(None, description="S3 preview URL")
    error_message: Optional[str] = Field(None, description="Error details (if failed)")
    
    # Legacy fields (for backward compatibility)
    progress: int = Field(0, ge=0, le=100, description="DEPRECATED: Progress percentage")
    dev_task_id: Optional[str] = Field(None, description="DEPRECATED")
    query_hash: Optional[str] = Field(None, description="Query hash from workflow")
    created_at: Optional[datetime] = Field(None)
    completed_at: Optional[datetime] = Field(None)
    
    class Config:
        json_schema_extra = {
            "example": {
                "generation_version_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "processing",
                "started_at": "2025-01-16T10:30:00Z",
                "elapsed_seconds": 15,
                "current_node": "",
                "current_node_display": "Generating page layouts",
                "nodes_completed": 5,
                "execution_log": [
                    {
                        "node_name": "planner",
                        "display_name": "Planning workflow",
                        "status": "completed",
                        "completed_at": "2025-01-16T10:30:02Z"
                    }
                ],
            }
        }


class CompilePreviewResponse(BaseModel):
    """Response from preview compilation"""
    success: bool
    preview_link: str
    dev_task_id: str
    generation_version_id: Optional[uuid.UUID] = Field(None)
    message: str = "Preview compiled successfully"


# ============================================================================
# GENERATION CONFIG LIST (MongoDB workflow_input)
# ============================================================================


class GenerationConfigItemConfig(BaseModel):
    """Nested config from workflow_input.initial_input"""
    intent: Optional[str] = Field(None, description="Website intention")
    tone: Optional[str] = Field(None, description="Website tone")
    color_palette_id: Optional[str] = Field(None, description="Color palette ID")


class GenerationConfigItem(BaseModel):
    """Single generation config from MongoDB workflow_input collection"""
    generation_version_id: str = Field(..., description="Generation version UUID")
    config: GenerationConfigItemConfig = Field(
        default_factory=GenerationConfigItemConfig,
        description="Intent, tone, color_palette_id",
    )
    created_at: Optional[datetime] = Field(None, description="When config was created")
    page_id: Optional[str] = Field(None, description="Page ID this generation belongs to")


class GenerationConfigListResponse(BaseModel):
    """Response for GET /generations/configs"""
    configs: List[GenerationConfigItem] = Field(
        default_factory=list,
        description="Generation configs for the user's business, newest first",
    )


# ============================================================================
# USE SECTION IDS (direct generation)
# ============================================================================


class UseTemplateRequest(BaseModel):
    """Request to create a new generation using a different cached template."""
    source_generation_version_id: uuid.UUID = Field(..., description="Generation to use as source (same page, same intent)")
    selected_template_index: int = Field(..., ge=0, le=2, description="Index of template to use (0, 1, or 2)")


class RegenerateColorThemeRequest(BaseModel):
    """Request to regenerate color theme using AutopopOnlyWorkflow"""
    palette_id: str = Field(..., description="Color palette ID")
    palette: dict = Field(..., description="Full palette object with colors")
    font_family: Optional[str] = Field(None, description="Font family (optional)")


class RegenerateContentRequest(BaseModel):
    """Request to regenerate content using AutopopOnlyWorkflow"""
    # Empty body - no fields needed for content regeneration


class UseTemplateResponse(BaseModel):
    """Response from POST /generations/use-section-ids or use-template (legacy compatibility)"""
    generation_version_id: uuid.UUID = Field(..., description="New generation version ID")
    status: str = Field(default="pending", description="pending, processing")
    message: str = Field(default="Generation started.", description="Human-readable message")
    page_id: Optional[uuid.UUID] = Field(default=None, description="Page ID (present when a new page was created)")


class AddSectionInPlaceRequest(BaseModel):
    """Request to add or replace a section in-place (updates 3 DBs with lorem)."""
    section_id: str = Field(..., description="ObjectId of the section to add/replace")
    insert_index: int = Field(default=-1, description="Position for insert mode (-1 = beginning)")
    mode: Literal["insert", "replace"] = Field(default="insert", description="'insert' or 'replace'")
    replace_index: Optional[int] = Field(None, description="0-based index for replace mode (required when mode='replace')")


class RegenerateSectionRequest(BaseModel):
    """Request to regenerate content for a single section."""
    section_id: str = Field(..., description="ObjectId of the section to regenerate")
    section_index: int = Field(..., ge=0, description="0-based index of the section")


class UseSectionIdsRequest(BaseModel):
    """Request to create a new generation using specific section IDs."""
    source_generation_version_id: uuid.UUID = Field(..., description="Generation to use as source (same page)")
    section_ids: List[str] = Field(..., description="List of section IDs to use")
    intent: Optional[str] = Field(None, description="Website intention (if different from source)")
    page_path: Optional[str] = Field(None, description="Page path for new page (e.g., '/about'). If provided, creates a new WebsitePage.")
    page_title: Optional[str] = Field(None, description="Page title for new page (e.g., 'About Us'). Required if page_path is provided.")
    page_type: Optional[str] = Field(None, description="Page type slug (e.g., 'contact-us', 'services'). If not provided, derived from page_path.")


class TemplateOption(BaseModel):
    """Single template option for the editor (from smb_section_cache)."""
    template_id: str = Field(..., description="Template identifier")
    template_name: str = Field(..., description="Display name")
    section_count: int = Field(..., description="Number of sections")
    index: int = Field(..., description="Index in list (0, 1, 2)")
    is_current: bool = Field(default=False, description="True if this template is used for the current generation")
    section_ids: List[str] = Field(default=None, description="List of section IDs in a template")
    section_desktop_urls: Optional[List[str]] = Field(default=None, description="URLs for section desktop previews")
    intent: Optional[str] = Field(default=None, description="Website intention for this template")


class GenerationTemplatesResponse(BaseModel):
    """Response for GET /generations/{generation_version_id}/templates"""
    templates: List[TemplateOption] = Field(
        default_factory=list,
        description="Available template options (typically 3) with is_current set for the one in use",
    )


# ============================================================================
# GENERATION PERFORMANCE METRICS (MongoDB generation_performance_metrics)
# ============================================================================


class MinMaxSumCount(BaseModel):
    """Aggregate stats: min, max, sum, count."""
    min: Optional[int] = None
    max: Optional[int] = None
    sum: Optional[int] = None
    count: int = 0


class DurationStats(BaseModel):
    """Duration stats with optional percentiles (ms)."""
    min: Optional[int] = None
    max: Optional[int] = None
    p50: Optional[float] = None
    p95: Optional[float] = None
    count: int = 0


class NodeDeliveryAttempt(BaseModel):
    """Per-node delivery attempt from orchestration (success or failed) with timing."""
    node_name: str = Field(..., description="Internal node identifier")
    status: str = Field(..., description="success or failed")
    attempted_at: Optional[str] = Field(None, description="ISO datetime when attempt started (for time-series)")
    duration_ms: Optional[int] = None
    error_type: Optional[str] = None


class NodeReceivedEntry(BaseModel):
    """Per-node received entry on main app (payload size and Redis write timing)."""
    node_name: str = Field(..., description="Internal node identifier")
    payload_bytes: int = 0
    redis_write_ms: int = 0
    received_at: Optional[str] = Field(None, description="ISO datetime when received")


class NodeUpdatesMetrics(BaseModel):
    """Node-update metrics (orchestration attempted/failed + main app received)."""
    attempted: Optional[int] = None
    failed: Optional[int] = None
    failed_reasons: Optional[dict] = Field(None, description="Error type name -> count")
    received: int = 0
    payload_bytes: Optional[MinMaxSumCount] = None
    redis_write_duration_ms: Optional[DurationStats] = None
    node_delivery_attempts: Optional[List[NodeDeliveryAttempt]] = Field(
        None, description="Per-node attempts from orchestration (success/failed + duration_ms)"
    )
    nodes_received: Optional[List[NodeReceivedEntry]] = Field(
        None, description="Per-node received on main app (payload_bytes, redis_write_ms)"
    )


class StatusPollsMetrics(BaseModel):
    """Status poll metrics (count, response size, Redis read duration)."""
    count: int = 0
    response_bytes: Optional[MinMaxSumCount] = None
    redis_read_duration_ms: Optional[DurationStats] = None
    poll_timestamps: Optional[List[str]] = Field(
        None, description="ISO datetimes of each poll (for time-series graphs)"
    )


class GenerationPerformanceMetrics(BaseModel):
    """Persisted per-generation performance metrics (GET /generations/{id}/metrics)."""
    generation_version_id: str = Field(..., description="Generation version UUID")
    status: str = Field(..., description="completed or failed")
    recorded_at: Optional[datetime] = Field(None, description="When document was written")
    started_at: Optional[str] = Field(None, description="ISO datetime of first node-update or poll")
    completed_at: Optional[str] = Field(None, description="ISO datetime when callback was received")
    duration_seconds: Optional[int] = None
    node_updates: Optional[NodeUpdatesMetrics] = None
    status_polls: Optional[StatusPollsMetrics] = None
    execution_log_length: Optional[int] = None
    business_id: Optional[str] = Field(None, description="Business UUID for filtering")

