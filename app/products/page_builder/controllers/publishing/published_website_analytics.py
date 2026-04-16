"""Analytics API endpoints"""
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.products.page_builder.schemas.publishing.published_website_analytics import (
    OverviewResponse,
    PagesResponse,
    SourcesResponse,
    CountriesResponse,
    DevicesResponse
)
from app.products.page_builder.services.publishing.published_website_analytics_service import AnalyticsService, get_analytics_service


router = APIRouter(prefix="/published-website-analytics", tags=["Published Website Analytics"])


@router.get("/website/{website_id}/overview", response_model=OverviewResponse)
async def get_website_overview(
    website_id: UUID,
    start_date: Optional[date] = Query(
        None,
        description="Start date for analytics (YYYY-MM-DD). Default: 30 days ago"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for analytics (YYYY-MM-DD). Default: today"
    ),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get overview analytics for a website.
    
    Returns:
    - Total pageviews and unique visitors
    - Daily trend data
    - Top 10 pages
    
    **Date Range:**
    - Default: Last 30 days
    - Custom: Provide both start_date and end_date
    - Maximum: Any historical range available
    
    **Authorization:** Requires user to own the website
    """
    try:
        result = await analytics_service.get_website_overview(
            website_id=website_id,
            start_date=start_date,
            end_date=end_date
        )
        return OverviewResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch overview: {str(e)}")


@router.get("/website/{website_id}/pages", response_model=PagesResponse)
async def get_pages_breakdown(
    website_id: UUID,
    start_date: Optional[date] = Query(
        None,
        description="Start date for analytics (YYYY-MM-DD). Default: 30 days ago"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for analytics (YYYY-MM-DD). Default: today"
    ),
    limit: int = Query(
        50,
        ge=1,
        le=100,
        description="Maximum number of pages to return (1-100)"
    ),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get page-level analytics breakdown.
    
    Returns:
    - List of pages with pageviews and unique visitors
    - Sorted by pageviews (descending)
    
    **Pagination:**
    - Use `limit` parameter to control number of results
    - Maximum: 100 pages
    
    **Authorization:** Requires user to own the website
    """
    try:
        result = await analytics_service.get_pages_breakdown(
            website_id=website_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        return PagesResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch pages: {str(e)}")


@router.get("/website/{website_id}/sources", response_model=SourcesResponse)
async def get_traffic_sources(
    website_id: UUID,
    start_date: Optional[date] = Query(
        None,
        description="Start date for analytics (YYYY-MM-DD). Default: 30 days ago"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for analytics (YYYY-MM-DD). Default: today"
    ),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get traffic sources (referrers) breakdown.
    
    Returns:
    - List of traffic sources with pageview counts
    - Sorted by pageviews (descending)
    
    **Source Types:**
    - `direct`: Direct traffic (no referrer)
    - `google.com`: Search engines
    - `facebook.com`: Social media
    - Domain names: Other referrers
    
    **Authorization:** Requires user to own the website
    """
    try:
        result = await analytics_service.get_traffic_sources(
            website_id=website_id,
            start_date=start_date,
            end_date=end_date
        )
        return SourcesResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sources: {str(e)}")


@router.get("/website/{website_id}/countries", response_model=CountriesResponse)
async def get_countries(
    website_id: UUID,
    start_date: Optional[date] = Query(
        None,
        description="Start date for analytics (YYYY-MM-DD). Default: 30 days ago"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for analytics (YYYY-MM-DD). Default: today"
    ),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get geographic (country) breakdown.
    
    Returns:
    - List of countries with pageview counts
    - Sorted by pageviews (descending)
    
    **Country Codes:**
    - ISO 3166-1 alpha-2 format (US, IN, UK, CA, etc.)
    - Inferred from CloudFront edge location
    
    **Authorization:** Requires user to own the website
    """
    try:
        result = await analytics_service.get_countries(
            website_id=website_id,
            start_date=start_date,
            end_date=end_date
        )
        return CountriesResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch countries: {str(e)}")


@router.get("/website/{website_id}/devices", response_model=DevicesResponse)
async def get_devices(
    website_id: UUID,
    start_date: Optional[date] = Query(
        None,
        description="Start date for analytics (YYYY-MM-DD). Default: 30 days ago"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for analytics (YYYY-MM-DD). Default: today"
    ),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get device type breakdown.
    
    Returns:
    - List of device types with pageview counts
    - Sorted by pageviews (descending)
    
    **Device Types:**
    - `mobile`: Mobile phones
    - `desktop`: Desktop computers
    - `tablet`: Tablets
    
    **Detection Method:**
    - Parsed from User-Agent header
    
    **Authorization:** Requires user to own the website
    """
    try:
        result = await analytics_service.get_devices(
            website_id=website_id,
            start_date=start_date,
            end_date=end_date
        )
        return DevicesResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch devices: {str(e)}")


@router.get("/health")
async def analytics_health_check():
    """Health check for analytics service"""
    return {
        "status": "healthy",
        "service": "analytics",
        "endpoints": [
            "/analytics/website/{id}/overview",
            "/analytics/website/{id}/pages",
            "/analytics/website/{id}/sources",
            "/analytics/website/{id}/countries",
            "/analytics/website/{id}/devices"
        ]
    }