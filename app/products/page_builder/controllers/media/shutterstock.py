from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.products.page_builder.services.media.shutterstock_service import ShutterstockService
from app.shared.services.auth.users_service import get_current_user
from app.shared.models import User


router = APIRouter(prefix="/shutterstock", tags=["shutterstock"])


def get_shutterstock_service() -> ShutterstockService:
    """Dependency to get ShutterstockService instance."""
    return ShutterstockService()


@router.get("/images/search")
async def search_images(
    query: str = Query(..., description="Search keywords"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=500, description="Results per page"),
    added_date: Optional[str] = Query(None, description="Show images added on date (YYYY-MM-DD)"),
    added_date_end: Optional[str] = Query(None, description="Show images added before date (YYYY-MM-DD)"),
    added_date_start: Optional[str] = Query(None, description="Show images added on/after date (YYYY-MM-DD)"),
    aspect_ratio: Optional[float] = Query(None, description="Show images with aspect ratio"),
    aspect_ratio_max: Optional[float] = Query(None, description="Show images with aspect ratio or lower"),
    aspect_ratio_min: Optional[float] = Query(None, description="Show images with aspect ratio or higher"),
    category: Optional[str] = Query(None, description="Shutterstock category name or ID"),
    color: Optional[str] = Query(None, description="Hex color (4F21EA) or 'grayscale'"),
    contributor: Optional[list[str]] = Query(None, description="Contributor names or IDs"),
    contributor_country: Optional[list[str]] = Query(None, description="Country codes (ISO 3166 Alpha-2)"),
    fields: Optional[str] = Query(None, description="Fields to display in response"),
    height_from: Optional[int] = Query(None, description="Minimum height in pixels"),
    height_to: Optional[int] = Query(None, description="Maximum height in pixels"),
    image_type: Optional[list[str]] = Query(None, description="Image types: photo, illustration, vector"),
    keyword_safe_search: bool = Query(True, description="Hide unsafe keywords"),
    language: Optional[str] = Query(None, description="Query and result language"),
    library: Optional[list[str]] = Query(None, description="Libraries: shutterstock, offset"),
    license: Optional[list[str]] = Query(None, description="License types: commercial, editorial, enhanced"),
    model: Optional[list[str]] = Query(None, description="Model IDs"),
    orientation: Optional[str] = Query(None, description="Orientation: horizontal, vertical"),
    people_age: Optional[str] = Query(None, description="Age: infants, children, teenagers, 20s, 30s, 40s, 50s, 60s, older"),
    people_ethnicity: Optional[list[str]] = Query(None, description="Ethnicities or NOT filters"),
    people_gender: Optional[str] = Query(None, description="Gender: male, female, both"),
    people_model_released: Optional[bool] = Query(None, description="Signed model release"),
    people_number: Optional[int] = Query(None, ge=0, le=4, description="Number of people (max: 4)"),
    region: Optional[str] = Query(None, description="Country code or IP for relevance"),
    safe: bool = Query(True, description="Enable safe search"),
    sort: str = Query("popular", description="Sort: newest, popular, relevance, random, oldest"),
    spellcheck_query: bool = Query(True, description="Spellcheck and suggest spellings"),
    view: str = Query("minimal", description="Detail level: minimal, full"),
    width_from: Optional[int] = Query(None, description="Minimum width in pixels"),
    width_to: Optional[int] = Query(None, description="Maximum width in pixels"),
    current_user: User = Depends(get_current_user),
    shutterstock_service: ShutterstockService = Depends(get_shutterstock_service),
):
    """
    Search for images on Shutterstock.
    Requires authentication. Proxies request to Shutterstock API with comprehensive filter support.
    """
    result = await shutterstock_service.search_images(
        query=query,
        page=page,
        per_page=per_page,
        added_date=added_date,
        added_date_end=added_date_end,
        added_date_start=added_date_start,
        aspect_ratio=aspect_ratio,
        aspect_ratio_max=aspect_ratio_max,
        aspect_ratio_min=aspect_ratio_min,
        category=category,
        color=color,
        contributor=contributor,
        contributor_country=contributor_country,
        fields=fields,
        height_from=height_from,
        height_to=height_to,
        image_type=image_type,
        keyword_safe_search=keyword_safe_search,
        language=language,
        library=library,
        license=license,
        model=model,
        orientation=orientation,
        people_age=people_age,
        people_ethnicity=people_ethnicity,
        people_gender=people_gender,
        people_model_released=people_model_released,
        people_number=people_number,
        region=region,
        safe=safe,
        sort=sort,
        spellcheck_query=spellcheck_query,
        view=view,
        width_from=width_from,
        width_to=width_to,
    )
    return result


@router.get("/images/{image_id}")
async def get_image_details(
    image_id: str,
    language: Optional[str] = Query(None, description="Language for keywords and categories"),
    view: str = Query("full", description="Detail level: minimal, full"),
    search_id: Optional[str] = Query(None, description="Related search ID"),
    current_user: User = Depends(get_current_user),
    shutterstock_service: ShutterstockService = Depends(get_shutterstock_service),
):
    """
    Get detailed information about a specific image.
    Requires authentication. Returns full image details including preview URLs and metadata.
    """
    result = await shutterstock_service.get_image_details(
        image_id=image_id,
        language=language,
        view=view,
        search_id=search_id,
    )
    return result


@router.get("/videos/search")
async def search_videos(
    query: str = Query(..., description="Search keywords"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=500, description="Results per page"),
    duration_from: Optional[int] = Query(None, description="Minimum duration (seconds)"),
    duration_to: Optional[int] = Query(None, description="Maximum duration (seconds)"),
    fps: Optional[int] = Query(None, description="Frames per second"),
    resolution: Optional[str] = Query(None, description="Resolution: SD, HD, 4K"),
    codec: Optional[str] = Query(None, description="Codec: h264, prores"),
    aspect_ratio: Optional[str] = Query(None, description="Aspect ratio: 16:9, 9:16"),
    safe: bool = Query(True, description="Enable safe search"),
    sort: str = Query("popular", description="Sort: newest, popular, relevance, random"),
    view: str = Query("minimal", description="Detail level: minimal, full"),
    current_user: User = Depends(get_current_user),
    shutterstock_service: ShutterstockService = Depends(get_shutterstock_service),
):
    """
    Search for videos on Shutterstock.
    """
    result = await shutterstock_service.search_videos(
        query=query,
        page=page,
        per_page=per_page,
        duration_from=duration_from,
        duration_to=duration_to,
        fps=fps,
        resolution=resolution,
        codec=codec,
        aspect_ratio=aspect_ratio,
        safe=safe,
        sort=sort,
        view=view,
    )
    return result


@router.get("/videos/{video_id}")
async def get_video_details(
    video_id: str,
    view: str = Query("full", description="Detail level: minimal, full"),
    search_id: Optional[str] = Query(None, description="Related search ID"),
    current_user: User = Depends(get_current_user),
    shutterstock_service: ShutterstockService = Depends(get_shutterstock_service),
):
    """
    Get detailed information about a specific video.
    """
    result = await shutterstock_service.get_video_details(
        video_id=video_id,
        view=view,
        search_id=search_id,
    )
    return result