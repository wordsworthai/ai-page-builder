"""Media API endpoints for file uploads and stock ingestion."""
from typing import Optional, List
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, Body
from datetime import datetime, UTC

from app.products.page_builder.services.media.media_service import MediaService, get_media_service
from app.products.page_builder.services.media.shutterstock_service import ShutterstockService, get_shutterstock_service
from app.products.page_builder.schemas.media.media import IngestStockRequest
from app.products.page_builder.schemas.media.media import BulkIngestStockRequest
from app.products.page_builder.services.media.gemini_service import GeminiService, get_gemini_service, get_gemini_media_orchestrator
from app.products.page_builder.schemas.media.media import GenerateAndIngestRequest, GenerateAndIngestResponse, BatchStatusResponse
from app.products.page_builder.schemas.media.media import SlotMediaMatchRequest
from app.shared.services.auth.users_service import get_current_user
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.utils.user_helpers import get_business_id_from_user
from app.core.db import get_async_db_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.products.page_builder.schemas.media.media import (
    BatchSubmitRequest,
    BatchSubmitResponse,
    BatchStatusResponse,
    BatchPollResponse,
    BatchProcessResponse,
     PostprocessRequest,
    PostprocessResponse,
    PostprocessStatusResponse,
)

from app.products.page_builder.services.media.variation_service import VariationService, get_variation_service



router = APIRouter(prefix="/media", tags=["Media"])


@router.post(
    "/upload",
    response_model=dict,
    responses={
        400: {"description": "Validation error"},
        500: {"description": "Server error"},
    },
    summary="Upload media file",
    description="""
    Upload an image or video file to the media library.
    
    **Supported file types:**
    - Images: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF (max 20MB)
    - Videos: MP4, WebM, MOV, AVI, MKV, MPEG, OGG (max 100MB)
    
    **Features:**
    - Automatic MIME type detection using magic bytes
    - Image dimension extraction
    - Video metadata extraction (dimensions, duration)
    - Automatic video thumbnail generation
    - Files are stored in S3
    """
)
async def upload_media(
    file: UploadFile = File(..., description="The media file to upload"),
    business_id: str = Form(..., description="Business ID (required)"),
    alt: Optional[str] = Form(None, description="Alt text for accessibility"),
    media_service: MediaService = Depends(get_media_service),
):
    """
    Upload a media file (image or video) to the media library.
    
    The file is validated, processed (metadata extracted, thumbnails generated for videos),
    uploaded to S3, and stored in MongoDB.
    """
    # Validate business_id is provided
    if not business_id or not business_id.strip():
        raise HTTPException(
            status_code=400,
            detail="business_id is required"
        )
    
    # Check file was provided
    if not file or not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided"
        )
    
    # Process upload
    try:
        result = await media_service.upload_media(
            file=file,
            business_id=business_id.strip(),
            alt=alt
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )


@router.get(
    "/overview",
    response_model=dict,
    summary="Get media overview",
    description="Returns recent 6 media thumbnails/references for a business."
)
async def get_media_overview(
    business_id: str = Query(..., description="Business ID"),
    media_service: MediaService = Depends(get_media_service),
):
    """Returns recent 6 media thumbnails/references for a business."""
    return await media_service.get_media_overview(business_id)


@router.get(
    "/details",
    response_model=dict,
    summary="Get media details",
    description="Returns all media assets with metadata for a business."
)
async def get_media_details(
    business_id: str = Query(..., description="Business ID"),
    media_service: MediaService = Depends(get_media_service),
):
    """Returns all media assets with metadata for a business."""
    return await media_service.get_media_details(business_id)


@router.post(
    "/ingest-stock/{image_id}",
    response_model=dict,
    summary="Ingest stock image from Shutterstock",
    description="Fetch Shutterstock image details, upload preview to S3, and store media document.",
)
async def ingest_stock_image(
    image_id: str,
    payload: IngestStockRequest = Body(...),
    media_service: MediaService = Depends(get_media_service),
    shutterstock_service: ShutterstockService = Depends(get_shutterstock_service),
):
    """Ingest a stock image and persist it to media storage."""
    return await media_service.ingest_stock_image(
        image_id=image_id,
        search_query=payload.search_query,
        business_id=payload.business_id,
        shutterstock_service=shutterstock_service,
    )


@router.post(
    "/ingest-stock-video/{video_id}",
    response_model=dict,
    summary="Ingest stock video from Shutterstock",
    description="Fetch Shutterstock video details, upload preview to S3, and store media document.",
)
async def ingest_stock_video(
    video_id: str,
    payload: IngestStockRequest = Body(...),
    media_service: MediaService = Depends(get_media_service),
    shutterstock_service: ShutterstockService = Depends(get_shutterstock_service),
):
    """Ingest a stock video and persist it to media storage."""
    return await media_service.ingest_stock_video(
        video_id=video_id,
        search_query=payload.search_query,
        business_id=payload.business_id,
        shutterstock_service=shutterstock_service,
    )


@router.delete(
    "/{media_id}",
    response_model=dict,
    responses={
        400: {"description": "Invalid media ID format"},
        404: {"description": "Media not found"},
        500: {"description": "Server error"},
    },
    summary="Delete media",
    description="Permanently delete a media file (uploaded or stock) from S3 storage and MongoDB."
)
async def delete_media(
    media_id: str,
    business_id: str = Query(..., description="Business ID (for authorization)"),
    media_service: MediaService = Depends(get_media_service),
):
    """
    Delete a media file permanently.
    
    This removes the file from S3 storage (including video thumbnails) 
    and deletes the document from MongoDB. Stock items also remove their
    linked stock_media document.
    """
    return await media_service.delete_media_by_id(media_id, business_id)


@router.post(
    "/admin/bulk-ingest-stock",
    response_model=dict,
    summary="Bulk ingest stock media by query",
    description="""
    Admin endpoint for bulk ingesting stock media (images or videos).
    
    **Use case:** Populate stock media database for specific trades.
    
    **Process:**
    1. Searches Shutterstock with provided query
    2. Takes top N results (15 for images, 5 for videos recommended)
    3. Ingests each result with trade_type metadata
    4. Stores in media_management.media collection
    
    **Example:**
    ```json
    {
        "query": "professional plumber fixing pipe",
        "trade_type": "plumbing",
        "media_type": "image",
        "limit": 15
    }
    ```
    """,
)
async def bulk_ingest_stock_media(
    payload: BulkIngestStockRequest = Body(...),
    media_service: MediaService = Depends(get_media_service),
    shutterstock_service: ShutterstockService = Depends(get_shutterstock_service),
):
    """
    Bulk ingest stock media for a single query.
    
    This endpoint is designed to be called from Jupyter notebooks
    or scripts to populate the stock media database.
    """
    result = await media_service.bulk_ingest_stock_by_query(
        query=payload.query,
        trade_type=payload.trade_type,
        media_type=payload.media_type,
        limit=payload.limit,
        shutterstock_service=shutterstock_service,
    )
    
    return result




@router.post(
    "/admin/generate-and-ingest",
    response_model=GenerateAndIngestResponse,
    summary="Generate AI images and ingest to S3/MongoDB",
    description="""
    Generate images using Gemini API and automatically ingest them.
    
    **API Modes:**
    
    - **Batch API** (`use_realtime=false`, default): Higher rate limits, up to 24hr turnaround.
      ⚠️ Does NOT support `aspect_ratio` or `image_size` - generates 1024x1024 images.
      Best for: High-volume generation where dimensions don't matter.
    
    - **Real-time API** (`use_realtime=true`): Immediate generation with full control.
      ✅ Supports `aspect_ratio` ("1:1", "16:9", "4:3", etc.) and `image_size` ("1K", "2K", "4K").
      Best for: When specific image dimensions are required.
    
    **Process:**
    1. Submit prompts to Gemini (batch or real-time based on flag)
    2. For batch: Poll until generation complete (~10-30 min)
    3. Download/receive generated images
    4. Upload each to S3
    5. Insert documents to MongoDB
    
    **Example - Real-time API (with aspect ratio):**
```json
    {
        "prompts": ["A plumber fixing a copper pipe", "HVAC technician installing AC unit"],
        "trade_type": "plumbing",
        "org_id": "00000000-0000-0000-0000-000000000000",
        "aspect_ratio": "16:9",
        "image_size": "2K",
        "use_realtime": true
    }
```

    **Example - Batch API (high volume):**
```json
    {
        "prompts": ["prompt1", "prompt2", "...50 more prompts..."],
        "trade_type": "hvac",
        "org_id": "00000000-0000-0000-0000-000000000000",
        "use_realtime": false
    }
```
    """
)
async def generate_and_ingest_images(
    payload: GenerateAndIngestRequest = Body(...),
    media_service: MediaService = Depends(get_media_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """Generate AI images via Gemini API and ingest to media storage"""
    
    orchestrator = get_gemini_media_orchestrator(media_service, gemini_service)
    
    try:
        result = await orchestrator.generate_and_ingest_images(
            prompts=payload.prompts,
            trade_type=payload.trade_type,
            org_id=payload.org_id,
            style_modifier=payload.style_modifier,
            aspect_ratio=payload.aspect_ratio,
            image_size=payload.image_size,
            model=payload.model,
            category=payload.category,
            use_realtime=payload.use_realtime,
        )
        
        return GenerateAndIngestResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate and ingest images: {str(e)}"
        )


@router.get(
    "/admin/batch-status/{batch_name}",
    response_model=BatchStatusResponse,
    summary="Check Gemini batch job status",
    description="Get the current status of a Gemini batch generation job"
)
async def get_batch_status(
    batch_name: str,
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """Check status of a batch job"""
    
    try:
        status = gemini_service.get_batch_status(batch_name)
        return BatchStatusResponse(**status)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get batch status: {str(e)}"
        )




# =============================================================================
# PHASE 1: SUBMIT BATCHES
# =============================================================================


@router.post(
    "/admin/batch-submit",
    response_model=BatchSubmitResponse,
    summary="Submit batches for a trade (Phase 1)",
    description="""
    Submit batch jobs for AI image generation. This is idempotent - if batches
    are already submitted, it returns the existing batch info without resubmitting.
    
    **Process:**
    1. Checks trade status in MongoDB
    2. If status='ready', distributes prompts by aspect ratio and submits batches
    3. If status='batches_submitted', returns existing batch info (no resubmit)
    4. Stores batch_job_names in MongoDB for tracking
    
    **Idempotent:** Safe to call multiple times. Won't charge twice.
    """
)
async def submit_batches(
    payload: BatchSubmitRequest = Body(...),
    media_service: MediaService = Depends(get_media_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """Submit batch jobs for a trade"""
    orchestrator = get_gemini_media_orchestrator(media_service, gemini_service)
    try:
        result = await orchestrator.submit_batches_for_trade(
            trade_type=payload.trade_type,
            org_id=payload.org_id,
            style_modifier=payload.style_modifier,
            image_size=payload.image_size,
            model=payload.model,
        )
        return BatchSubmitResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/admin/batch-submit-multiple",
    response_model=List[BatchSubmitResponse],
    summary="Submit batches for multiple trades",
    description="""
    Submit batch jobs for multiple trades at once. Each trade is processed
    independently and idempotently.
    """
)
async def submit_batches_multiple(
    trade_types: List[str] = Body(..., description="List of trade types to process"),
    org_id: str = Body(..., description="Organization ID"),
    style_modifier: str = Body(
        "Hyper-realistic photograph, shot on 35mm lens, professional lighting, shallow depth of field, natural colors, sharp focus"
    ),
    image_size: str = Body("2K"),
    model: str = Body("gemini-3-pro-image-preview"),
    media_service: MediaService = Depends(get_media_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """Submit batch jobs for multiple trades"""
    orchestrator = get_gemini_media_orchestrator(media_service, gemini_service)
    results = []
    for trade_type in trade_types:
        try:
            result = await orchestrator.submit_batches_for_trade(
                trade_type=trade_type,
                org_id=org_id,
                style_modifier=style_modifier,
                image_size=image_size,
                model=model,
            )
            results.append(BatchSubmitResponse(**result))
        except Exception as e:
            results.append(BatchSubmitResponse(
                success=False,
                trade_type=trade_type,
                message=f"Error: {str(e)}",
                batches_submitted=0
            ))
    return results


# =============================================================================
# PHASE 2: POLL BATCH STATUS
# =============================================================================

@router.get(
    "/admin/batch-poll/{trade_type}",
    response_model=BatchStatusResponse,
    summary="Poll batch status for a trade (Phase 2)",
    description="""
    Check the status of all batches for a trade. Updates MongoDB with current
    Gemini status.
    
    **Returns:**
    - Counts of pending, succeeded, failed, processed batches
    - Whether all batches are complete
    """
)
async def poll_batch_status(
    trade_type: str,
    media_service: MediaService = Depends(get_media_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """Poll batch status for a single trade"""
    orchestrator = get_gemini_media_orchestrator(media_service, gemini_service)
    try:
        result = await orchestrator.poll_batches_for_trade(
            trade_type=trade_type,
        )
        return BatchStatusResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/admin/batch-poll-multiple",
    response_model=BatchPollResponse,
    summary="Poll batch status for multiple trades",
    description="""
    Check the status of batches for multiple trades at once.
    
    **Returns:**
    - Overall summary (trades complete vs pending)
    - Details for each trade
    """
)
async def poll_batch_status_multiple(
    trade_types: List[str] = Body(..., description="List of trade types to poll"),
    media_service: MediaService = Depends(get_media_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """Poll batch status for multiple trades"""
    orchestrator = get_gemini_media_orchestrator(media_service, gemini_service)
    details = []
    trades_complete = 0
    trades_pending = 0
    
    for trade_type in trade_types:
        try:
            result = await orchestrator.poll_batches_for_trade(
                trade_type=trade_type,
            )
            details.append(BatchStatusResponse(**result))
            
            if result.get("is_complete", False):
                trades_complete += 1
            else:
                trades_pending += 1
        except Exception as e:
            details.append(BatchStatusResponse(
                trade_type=trade_type,
                status="error",
                total_batches=0,
                pending=0,
                succeeded=0,
                failed=0,
                processed=0
            ))
            trades_pending += 1
    
    return BatchPollResponse(
        success=True,
        message=f"{trades_complete}/{len(trade_types)} trades complete",
        total_trades=len(trade_types),
        trades_complete=trades_complete,
        trades_pending=trades_pending,
        details=details
    )


# =============================================================================
# PHASE 3: PROCESS COMPLETED BATCHES
# =============================================================================

@router.post(
    "/admin/batch-process/{trade_type}",
    response_model=BatchProcessResponse,
    summary="Process completed batches for a trade (Phase 3)",
    description="""
    Download completed batches from Gemini and ingest to S3/MongoDB.
    
    **Process:**
    1. Downloads images from each succeeded batch
    2. Uploads to S3
    3. Creates documents in media_management.media collection
    4. Updates trade status to 'generated' when all done
    
    **Idempotent:** Won't reprocess already processed batches.
    """
)
async def process_batches(
    trade_type: str,
    org_id: str = Query(..., description="Organization ID for S3 path"),
    media_service: MediaService = Depends(get_media_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """Process completed batches for a trade"""
    orchestrator = get_gemini_media_orchestrator(media_service, gemini_service)
    try:
        result = await orchestrator.process_batches_for_trade(
            trade_type=trade_type,
            org_id=org_id,
        )
        return BatchProcessResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/admin/batch-process-multiple",
    response_model=List[BatchProcessResponse],
    summary="Process completed batches for multiple trades",
    description="""
    Process completed batches for multiple trades at once.
    """
)
async def process_batches_multiple(
    trade_types: List[str] = Body(..., description="List of trade types to process"),
    org_id: str = Body(..., description="Organization ID for S3 path"),
    media_service: MediaService = Depends(get_media_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """Process completed batches for multiple trades"""
    orchestrator = get_gemini_media_orchestrator(media_service, gemini_service)
    results = []
    for trade_type in trade_types:
        try:
            result = await orchestrator.process_batches_for_trade(
                trade_type=trade_type,
                org_id=org_id,
            )
            results.append(BatchProcessResponse(**result))
        except Exception as e:
            results.append(BatchProcessResponse(
                success=False,
                trade_type=trade_type,
                message=f"Error: {str(e)}",
                total_images=0,
                uploaded_count=0,
                inserted_count=0,
                failed_count=0
            ))
    return results


# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@router.get(
    "/admin/batch-overview",
    summary="Get overview of all trade batch statuses",
    description="Returns a summary of batch status for all trades in the system."
)
async def get_batch_overview(
    media_service: MediaService = Depends(get_media_service),
):
    """Get overview of all batch statuses"""
    from app.core.db_mongo import get_mongo_collection
    
    collection = await get_mongo_collection("gemini_trade_queries", "trades")
    
    # Aggregate by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}, "trades": {"$push": "$trade_type"}}}
    ]
    
    results = await collection.aggregate(pipeline).to_list(length=100)
    
    overview = {}
    for r in results:
        overview[r["_id"]] = {
            "count": r["count"],
            "trades": r["trades"]
        }
    
    return {
        "success": True,
        "overview": overview,
        "total_trades": sum(r["count"] for r in results)
    }


@router.post(
    "/admin/batch-reset/{trade_type}",
    summary="Reset a trade back to 'ready' status (USE WITH CAUTION)",
    description="""
    Reset a trade back to 'ready' status. This will NOT refund any Gemini charges.
    Use only if you need to resubmit batches for some reason.
    
    **WARNING:** This does not delete batch jobs from Gemini. You will be charged
    again if you resubmit.
    """
)
async def reset_trade_status(
    trade_type: str,
    confirm: str = Query(..., description="Type 'RESET' to confirm"),
    media_service: MediaService = Depends(get_media_service),
):
    """Reset trade status (dangerous - use with caution)"""
    if confirm != "RESET":
        raise HTTPException(status_code=400, detail="Must confirm with 'RESET'")
    
    from app.core.db_mongo import get_mongo_collection
    
    collection = await get_mongo_collection("gemini_trade_queries", "trades")
    
    result = await collection.update_one(
        {"trade_type": trade_type},
        {
            "$set": {
                "status": "ready",
                "updated_at": datetime.now(UTC).replace(tzinfo=None)
            },
            "$unset": {
                "batch_jobs": "",
                "generation_config": "",
                "generation_progress": "",
                "batches_submitted_at": "",
                "generation_completed_at": ""
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail=f"Trade '{trade_type}' not found")
    
    return {
        "success": True,
        "message": f"Trade '{trade_type}' reset to 'ready' status"
    }





@router.get(
    "/recommended",
    response_model=dict,
    summary="Get recommended media for business",
    description="""
    Returns AI-generated media recommended for the business based on their assigned trades.
    
    **Flow:**
    1. Looks up business trades from business_type collection
    2. Queries media with matching trade_type and source="generated"
    3. Returns sorted by newest first
    
    **Use case:** Populate "Recommended" tab in media management UI.
    """
)
async def get_recommended_media(
    business_id: str = Query(..., description="Business ID"),
    media_type: Optional[str] = Query(None, description="Filter by media type: 'image', 'video', or None for all"),
    max_results: int = Query(50, description="Maximum number of results", ge=1, le=200),
    media_service: MediaService = Depends(get_media_service),
):
    """Returns recommended media based on business's assigned trades."""
    return await media_service.get_recommended_media(
        business_id=business_id,
        media_type=media_type,
        max_results=max_results
    )


@router.get(
    "/business-images",
    response_model=dict,
    summary="Get business images (logo, reviews, Google Photos)",
    description="""
    Returns business images from three sources:
    - Logo images (from LogoProvider)
    - Review photos (from ReviewPhotosProvider)
    - Google Photos (from BusinessPhotosProvider)
    
    **Flow:**
    1. Fetches logo images based on business trades
    2. Fetches review photos from Yelp data
    3. Fetches Google Maps business photos
    4. Returns all three categories in structured format
    
    **Use case:** Populate "Business Images" tab in media management UI.
    """
)
async def get_business_images(
    business_id: str = Query(..., description="Business ID"),
    media_service: MediaService = Depends(get_media_service),
):
    """Returns business images from logo, review, and Google Photos providers."""
    return await media_service.get_business_images(business_id=business_id)


@router.post(
    "/recommended/slot",
    response_model=dict,
    summary="Get slot-specific recommended media",
    description="""
    Returns slot-specific media recommendations using element_id, block_type, block_index, and section_id.
    
    Uses the same media matching service as the autopopulation workflow to find images or videos
    that match the slot's dimensions and context.
    
    **Flow:**
    1. Creates MediaSlot with slot identity (element_id, block_type, block_index, section_id)
    2. Calls media_service.match_images() or media_service.match_videos() based on media_type
    3. Returns matched media in MediaItem format
    
    **Use case:** Show slot-specific recommendations in the "Recommended" tab when
    opening media picker from a field in the editor.
    
    **Retrieval sources:**
    - For images: defaults to ["generated", "google_maps"]
    - For videos: defaults to ["stock", "generated"] (videos don't come from google_maps)
    """
)
async def get_slot_recommended_media(
    request: SlotMediaMatchRequest = Body(...),
    current_user: CurrentUserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Get slot-specific recommended media."""
    try:
        # Get business_id from current user
        business_id = await get_business_id_from_user(current_user, db)
        business_id_str = str(business_id)
        
        # Import media service from wwai-agent-orchestration (data.services)
        from wwai_agent_orchestration.data.services.media.media_service import media_service
        from wwai_agent_orchestration.data.services.models.media import (
            MediaSlot, MediaSlotIdentity, MediaMatchRequest
        )
        
        # Create MediaSlotIdentity
        slot_identity = MediaSlotIdentity(
            element_id=request.element_id,
            block_type=request.block_type,
            block_index=request.block_index,
            section_id=request.section_id
        )
        
        # Create MediaSlot
        media_slot = MediaSlot(
            width=request.width,
            height=request.height,
            slot_identity=slot_identity
        )
        
        # Determine media type (default to image)
        media_type = request.media_type or "image"
        
        # Set default retrieval sources based on media type if not provided
        # Videos don't come from google_maps, so use stock + generated
        # Images default to generated + google_maps
        default_retrieval_sources = (
            ["stock", "generated"] if media_type == "video" 
            else ["generated", "google_maps"]
        )
        
        # Create MediaMatchRequest with max_recommendations_per_slot
        # The matcher will automatically limit to min(max_recommendations, available_media)
        match_request = MediaMatchRequest(
            business_id=business_id_str,
            slots=[media_slot],
            retrieval_sources=request.retrieval_sources or default_retrieval_sources,
            max_recommendations_per_slot=request.max_recommendations
        )
        
        # Call appropriate media service method based on media_type
        if media_type == "video":
            # Call media service to match videos
            response = media_service.match_videos(match_request)
            
            # Convert VideoMatchResponse to MediaItem format for frontend
            media_items = []
            for result in response.results:
                if result.shopify_video:
                    video = result.shopify_video
                    media_items.append({
                        "_id": video.id,
                        "business_id": business_id_str,
                        "source": result.match_metadata.source if result.match_metadata else "stock",
                        "media_type": "video",
                        "size": 0,  # Size not available from match response
                        "video": {
                            "id": video.id,
                            "filename": video.filename,
                            "alt": video.alt or "",
                            "aspect_ratio": video.aspect_ratio,
                            "sources": [
                                {
                                    "url": src.url,
                                    "mime_type": src.mime_type,
                                    "format": src.format,
                                    "width": src.width,
                                    "height": src.height
                                }
                                for src in video.sources
                            ],
                            "preview_image": {
                                "url": video.preview_image.src if video.preview_image else "",
                                "width": video.preview_image.width if video.preview_image else 0,
                                "height": video.preview_image.height if video.preview_image else 0,
                                "alt": video.preview_image.alt if video.preview_image else ""
                            }
                        },
                        "created_at": datetime.now(UTC).replace(tzinfo=None).isoformat(),
                        "updated_at": datetime.now(UTC).replace(tzinfo=None).isoformat(),
                    })
            
            return {
                "success": True,
                "media": media_items,
                "total_count": len(media_items),
                "matched_count": response.matched_count,
                "unmatched_count": response.unmatched_count,
            }
        else:
            # Default: Call media service to match images
            response = media_service.match_images(match_request)
            
            # Convert MediaMatchResponse to MediaItem format for frontend
            media_items = []
            for result in response.results:
                if result.shopify_image:
                    img = result.shopify_image
                    media_items.append({
                        "_id": img.id,
                        "business_id": business_id_str,
                        "source": result.match_metadata.source if result.match_metadata else "generated",
                        "media_type": "image",
                        "size": 0,  # Size not available from match response
                        "image": {
                            "src": img.src,
                            "asset_path": img.src,
                            "filename": "",
                            "id": img.id,
                            "width": img.width,
                            "height": img.height,
                            "aspect_ratio": img.aspect_ratio,
                            "alt": img.alt or "",
                        },
                        "created_at": datetime.now(UTC).replace(tzinfo=None).isoformat(),
                        "updated_at": datetime.now(UTC).replace(tzinfo=None).isoformat(),
                    })
            
            # Results are already limited by the matcher to min(max_recommendations, available_images)
            
            return {
                "success": True,
                "media": media_items,
                "total_count": len(media_items),
                "matched_count": response.matched_count,
                "unmatched_count": response.unmatched_count,
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get slot-specific recommendations: {str(e)}"
        )





# =============================================================================
#  (PHASE 4: POST-PROCESSING)
# =============================================================================

@router.post(
    "/admin/postprocess-variations",
    response_model=PostprocessResponse,
    summary="Create image variations for a trade (Phase 4)",
    description="""
    Post-process generated images to create downscaled JPEG variations.
    
    **Creates 4 variations per image (+ keeps original):**
    - `0`: 300px max dimension - tiny thumbnails, icons
    - `1`: 500px max dimension - small cards
    - `2`: 1000px max dimension - medium displays  
    - `3`: 1500px max dimension - large displays, 1440px slots
    
    **Aspect ratio is preserved.** Max dimension = the larger side.
    
    **Idempotent:** Skips images that already have variations.
    Call repeatedly until `remaining=0`.
    
    **Example workflow:**
    ```python
    while True:
        result = post("/admin/postprocess-variations", {"trade_type": "plumbing", "batch_size": 50})
        print(f"Processed: {result['processed']}, Remaining: {result['remaining']}")
        if result['remaining'] == 0:
            break
    ```
    """
)
async def postprocess_variations(
    payload: PostprocessRequest = Body(...),
    variation_service: VariationService = Depends(get_variation_service),
):
    """Create image variations for a trade"""
    try:
        result = await variation_service.process_trade_variations(
            trade_type=payload.trade_type,
            batch_size=payload.batch_size
        )
        return PostprocessResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/admin/postprocess-variations-multiple",
    response_model=List[PostprocessResponse],
    summary="Create image variations for multiple trades",
    description="""
    Post-process variations for multiple trades in one call.
    
    Each trade processes up to `batch_size` images.
    Run repeatedly until all trades have `remaining=0`.
    """
)
async def postprocess_variations_multiple(
    trade_types: List[str] = Body(..., description="List of trade types to process"),
    batch_size: int = Body(50, ge=1, le=200, description="Images per trade per call"),
    variation_service: VariationService = Depends(get_variation_service),
):
    """Create image variations for multiple trades"""
    results = []
    for trade_type in trade_types:
        try:
            result = await variation_service.process_trade_variations(
                trade_type=trade_type,
                batch_size=batch_size
            )
            results.append(PostprocessResponse(**result))
        except Exception as e:
            results.append(PostprocessResponse(
                success=False,
                trade_type=trade_type,
                status="error",
                message=str(e),
                processed=0,
                failed=0,
                remaining=0
            ))
    return results


@router.get(
    "/admin/postprocess-status",
    response_model=PostprocessStatusResponse,
    summary="Check post-processing status",
    description="""
    Get status of variation post-processing.
    
    **Single trade:** Pass `trade_type` query param for detailed status.
    
    **All trades:** Omit `trade_type` to get overview of all generated trades.
    
    **Statuses:**
    - `pending`: Not started
    - `processing`: In progress
    - `complete`: All images have variations
    """
)
async def get_postprocess_status(
    trade_type: Optional[str] = Query(None, description="Specific trade to check (omit for all)"),
    variation_service: VariationService = Depends(get_variation_service),
):
    """Check post-processing status"""
    try:
        result = await variation_service.get_postprocess_status(trade_type=trade_type)
        return PostprocessStatusResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))