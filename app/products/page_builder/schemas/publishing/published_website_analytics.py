"""Pydantic schemas for analytics endpoints"""
from typing import List, Optional

from pydantic import BaseModel, Field


# ===== Common Schemas =====

class DateRange(BaseModel):
    """Date range information"""
    start: str = Field(..., description="Start date (YYYY-MM-DD)")
    end: str = Field(..., description="End date (YYYY-MM-DD)")
    days: int = Field(..., description="Number of days in range")


# ===== Overview Endpoint Schemas =====

class DailyTrend(BaseModel):
    """Daily analytics data point"""
    date: str = Field(..., description="Date (YYYY-MM-DD)")
    pageviews: int = Field(..., description="Page views for this day")
    unique_visitors: int = Field(..., description="Unique visitors for this day")


class TopPage(BaseModel):
    """Top page data"""
    page_path: str = Field(..., description="Page path (e.g., /, /about)")
    pageviews: int = Field(..., description="Total page views")
    unique_visitors: int = Field(..., description="Unique visitors")


class OverviewResponse(BaseModel):
    """Response for GET /analytics/website/{website_id}/overview"""
    website_id: str = Field(..., description="Website UUID")
    subdomain: str = Field(..., description="Website subdomain")
    date_range: DateRange
    total_pageviews: int = Field(..., description="Total page views in period")
    total_unique_visitors: int = Field(..., description="Total unique visitors in period")
    trend: List[DailyTrend] = Field(..., description="Daily trend data")
    top_pages: List[TopPage] = Field(..., description="Top 10 pages by views")
    message: Optional[str] = Field(None, description="Optional message (e.g., no data available)")


# ===== Pages Endpoint Schemas =====

class PageDetail(BaseModel):
    """Detailed page analytics"""
    page_path: str = Field(..., description="Page path")
    pageviews: int = Field(..., description="Total page views")
    unique_visitors: int = Field(..., description="Unique visitors")


class PagesResponse(BaseModel):
    """Response for GET /analytics/website/{website_id}/pages"""
    website_id: str = Field(..., description="Website UUID")
    subdomain: str = Field(..., description="Website subdomain")
    date_range: DateRange
    pages: List[PageDetail] = Field(..., description="List of pages with analytics")
    total_pages: int = Field(..., description="Total number of pages returned")


# ===== Sources Endpoint Schemas =====

class TrafficSource(BaseModel):
    """Traffic source data"""
    source: str = Field(..., description="Referrer domain or 'direct'")
    pageviews: int = Field(..., description="Page views from this source")


class SourcesResponse(BaseModel):
    """Response for GET /analytics/website/{website_id}/sources"""
    website_id: str = Field(..., description="Website UUID")
    subdomain: str = Field(..., description="Website subdomain")
    date_range: DateRange
    sources: List[TrafficSource] = Field(..., description="Traffic sources sorted by pageviews")
    total_sources: int = Field(..., description="Total number of unique sources")


# ===== Countries Endpoint Schemas =====

class CountryData(BaseModel):
    """Country analytics data"""
    country_code: str = Field(..., description="ISO 3166-1 alpha-2 country code (e.g., US, IN)")
    pageviews: int = Field(..., description="Page views from this country")


class CountriesResponse(BaseModel):
    """Response for GET /analytics/website/{website_id}/countries"""
    website_id: str = Field(..., description="Website UUID")
    subdomain: str = Field(..., description="Website subdomain")
    date_range: DateRange
    countries: List[CountryData] = Field(..., description="Countries sorted by pageviews")
    total_countries: int = Field(..., description="Total number of unique countries")


# ===== Devices Endpoint Schemas =====

class DeviceData(BaseModel):
    """Device analytics data"""
    device_type: str = Field(..., description="Device type (mobile, desktop, tablet)")
    pageviews: int = Field(..., description="Page views from this device type")


class DevicesResponse(BaseModel):
    """Response for GET /analytics/website/{website_id}/devices"""
    website_id: str = Field(..., description="Website UUID")
    subdomain: str = Field(..., description="Website subdomain")
    date_range: DateRange
    devices: List[DeviceData] = Field(..., description="Devices sorted by pageviews")
    total_device_types: int = Field(..., description="Total number of device types")