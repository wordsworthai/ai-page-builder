"""
Product Analytics Service

Handles storage and retrieval of product analytics events in MongoDB.
"""

from datetime import datetime
from typing import Optional, Dict, Any
import logging

from app.core.db_mongo import get_mongo_collection

logger = logging.getLogger(__name__)


class ProductAnalyticsService:
    """Service for managing product analytics events"""
    
    COLLECTION_NAME = "product_events"
    
    async def create_onboarding_event(
        self,
        session_id: str,
        business_name: Optional[str] = None,
        google_maps_url: Optional[str] = None,
        yelp_url: Optional[str] = None,
        google_places_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create onboarding event in MongoDB.
        
        Creates a NEW event every time - allows tracking multiple submissions
        from the same session (user editing/trying different businesses).
        
        Args:
            session_id: Frontend-generated UUID from localStorage
            business_name: Business name entered by user (optional)
            google_maps_url: Google Maps URL entered by user (optional)
            yelp_url: Yelp URL entered by user (optional)
            google_places_data: Full Google Places API response (optional)
            
        Returns:
            Created event document with _id
        """
        collection = await get_mongo_collection(
            collection_name=self.COLLECTION_NAME,
            db_name="businesses" 
        )

        
        now = datetime.now(UTC).replace(tzinfo=None)
        
        event = {
            "event_name": "business_info_submitted",
            "session_id": session_id,
            "timestamp": now,
            
            # Form data (what user filled)
            "business_name": business_name,
            "google_maps_url": google_maps_url,
            "yelp_url": yelp_url,
            "google_places_data": google_places_data,
            
            # Metadata
            "created_at": now,
        }
        
        # Insert event - always creates new document
        result = await collection.insert_one(event)
        event["_id"] = result.inserted_id
        
        logger.info(
            f"Created onboarding event: session_id={session_id}, "
            f"has_business_name={business_name is not None}, "
            f"has_google_url={google_maps_url is not None}"
        )
        
        return event
    
    async def get_events_by_session(self, session_id: str) -> list:
        """
        Get all events for a session (useful for debugging/analysis).
        
        Args:
            session_id: Session ID to query
            
        Returns:
            List of event documents
        """
        collection = await get_mongo_collection(
            self.COLLECTION_NAME, 
            db_name="businesses" 
        )
        cursor = collection.find({"session_id": session_id}).sort("created_at", -1)
        return await cursor.to_list(length=None)
    
    async def get_recent_events(self, limit: int = 100) -> list:
        """
        Get recent onboarding events (useful for admin dashboard).
        
        Args:
            limit: Maximum number of events to return
            
        Returns:
            List of recent event documents
        """
        collection = await get_mongo_collection(
            self.COLLECTION_NAME, 
            db_name="businesses"  
        )
        cursor = collection.find(
            {"event_name": "business_info_submitted"}
        ).sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=None)