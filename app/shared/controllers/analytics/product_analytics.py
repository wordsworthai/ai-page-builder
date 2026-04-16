"""
Product Analytics Controller

Tracks user behavior within the Wordsworth AI platform.
Unauthenticated endpoints for tracking anonymous user actions.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging

from app.shared.services.analytics.product_analytics_service import ProductAnalyticsService

logger = logging.getLogger(__name__)

# Create router
product_analytics_router = APIRouter(
    prefix="/api/product-analytics",
    tags=["product-analytics"]
)


class OnboardingEventCreate(BaseModel):
    """Schema for onboarding event creation"""
    session_id: str = Field(..., description="Frontend-generated session ID from localStorage")
    business_name: Optional[str] = Field(None, description="Business name entered by user")
    google_maps_url: Optional[str] = Field(None, description="Google Maps URL entered by user")
    yelp_url: Optional[str] = Field(None, description="Yelp URL entered by user")
    google_places_data: Optional[Dict[str, Any]] = Field(None, description="Full Google Places API response")


@product_analytics_router.post("/onboarding-event")
async def track_onboarding_event(data: OnboardingEventCreate) -> Dict[str, Any]:
    """
    Track business info submission from create-site flow.
    
    NO AUTHENTICATION REQUIRED - tracks anonymous user behavior.
    
    Event is created every time user clicks "Next" on business info form,
    regardless of whether they sign up or not.
    """
    try:
        service = ProductAnalyticsService()
        event = await service.create_onboarding_event(
            session_id=data.session_id,
            business_name=data.business_name,
            google_maps_url=data.google_maps_url,
            yelp_url=data.yelp_url,
            google_places_data=data.google_places_data
        )
        
        return {
            "success": True,
            "event_id": str(event["_id"]),
            "message": "Event tracked successfully"
        }
    except Exception as e:
        logger.error(f"Failed to track onboarding event: {str(e)}", exc_info=True)
        # Don't fail the user's flow - return success even if tracking fails
        return {
            "success": False,
            "message": "Event tracking failed but user flow continues"
        }