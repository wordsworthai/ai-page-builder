"""
Service for managing Google Maps scraped data in MongoDB.
Handles storage and retrieval of business scraped data.

FIXED: Storage format now uses wrapped structure for consistency.
"""
import logging
import uuid
from typing import Optional, Dict, Any

from app.products.page_builder.utils.generation.mongo_utils import (
    read_from_collection,
    upsert_into_collection
)

logger = logging.getLogger(__name__)

COLLECTION_NAME = "business_scraped_data"
# Explicitly use 'businesses' database for business data (not scraping_db)
BUSINESS_DB_NAME = "businesses"


def _convert_business_id(business_id: uuid.UUID | str) -> str:
    """Convert business_id UUID to string for MongoDB storage."""
    if isinstance(business_id, uuid.UUID):
        return str(business_id)
    return business_id


async def store_google_maps_data(
    business_id: uuid.UUID | str,
    google_maps_url: str,
    data: Dict[str, Any]
) -> bool:
    """
    Store Google Maps scraped data in MongoDB.
    
    FIXED: Now uses wrapped format {"key": url, "value": data} for consistency
    with orchestration system expectations.
    
    Args:
        business_id: Business UUID or string
        google_maps_url: Google Maps URL (stored as key)
        data: JSON data to store (stored as value)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        business_id_str = _convert_business_id(business_id)
        
        # Get existing document to preserve yelp_data
        existing_doc = await read_from_collection(
            COLLECTION_NAME,
            {"business_id": business_id_str},
            db_name=BUSINESS_DB_NAME
        )
        
        # Prepare update dict with WRAPPED format
        update_dict = {
            "business_id": business_id_str,
            "google_maps_data": {
                "key": google_maps_url,  # Store the source URL
                "value": data            # Store the actual data
            }
        }
        
        # Preserve yelp_data if exists
        if existing_doc and "yelp_data" in existing_doc:
            update_dict["yelp_data"] = existing_doc["yelp_data"]
        
        # Upsert document
        filter_dict = {"business_id": business_id_str}
        await upsert_into_collection(
            COLLECTION_NAME,
            filter_dict,
            update_dict,
            db_name=BUSINESS_DB_NAME
        )
        
        logger.info(f"Stored Google Maps data for business {business_id_str}")
        return True
    except Exception as e:
        logger.error(f"Error storing Google Maps data for business {business_id}: {str(e)}")
        return False


async def store_yelp_data(
    business_id: uuid.UUID | str,
    yelp_url: str,
    data: Dict[str, Any]
) -> bool:
    """
    Store Yelp scraped data in MongoDB.
    
    Args:
        business_id: Business UUID or string
        yelp_url: Yelp URL (stored as key)
        data: JSON data to store (stored as value)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        business_id_str = _convert_business_id(business_id)
        
        # Get existing document to preserve google_maps_data
        existing_doc = await read_from_collection(
            COLLECTION_NAME,
            {"business_id": business_id_str},
            db_name=BUSINESS_DB_NAME
        )
        
        # Prepare update dict with wrapped format
        update_dict = {
            "business_id": business_id_str,
            "yelp_data": {
                "key": yelp_url,
                "value": data
            }
        }
        
        # Preserve google_maps_data if exists
        if existing_doc and "google_maps_data" in existing_doc:
            update_dict["google_maps_data"] = existing_doc["google_maps_data"]
        
        # Upsert document
        filter_dict = {"business_id": business_id_str}
        await upsert_into_collection(
            COLLECTION_NAME,
            filter_dict,
            update_dict,
            db_name=BUSINESS_DB_NAME
        )
        
        logger.info(f"Stored Yelp data for business {business_id_str}")
        return True
    except Exception as e:
        logger.error(f"Error storing Yelp data for business {business_id}: {str(e)}")
        return False


async def get_business_scraped_data(
    business_id: uuid.UUID | str
) -> Optional[Dict[str, Any]]:
    """
    Retrieve all scraped data for a business.
    
    Args:
        business_id: Business UUID or string
    
    Returns:
        Document dict with google_maps_data and/or yelp_data, or None if not found
    
    Usage:
        data = await get_business_scraped_data(business_id=uuid_obj)
        if data:
            # Access wrapped format
            google_data = data.get('google_maps_data', {}).get('value')
            yelp_data = data.get('yelp_data', {}).get('value')
    """
    try:
        business_id_str = _convert_business_id(business_id)
        result = await read_from_collection(
            COLLECTION_NAME,
            {"business_id": business_id_str},
            db_name=BUSINESS_DB_NAME
        )
        return result
    except Exception as e:
        logger.error(f"Error retrieving scraped data for business {business_id}: {str(e)}")
        return None


async def get_google_maps_data(
    business_id: uuid.UUID | str
) -> Optional[Dict[str, Any]]:
    """
    Retrieve just the Google Maps data value for a business.
    
    Convenience method that unwraps the data.
    
    Args:
        business_id: Business UUID or string
    
    Returns:
        Google Maps data dict or None
    """
    try:
        doc = await get_business_scraped_data(business_id)
        if not doc:
            return None
        
        google_maps_data = doc.get("google_maps_data")
        if not google_maps_data:
            return None
        
        # Handle wrapped format
        if isinstance(google_maps_data, dict) and "value" in google_maps_data:
            return google_maps_data.get("value")
        
        # Handle legacy direct format
        return google_maps_data
    except Exception as e:
        logger.error(f"Error retrieving Google Maps data for business {business_id}: {str(e)}")
        return None


async def get_yelp_data(
    business_id: uuid.UUID | str
) -> Optional[Dict[str, Any]]:
    """
    Retrieve just the Yelp data value for a business.
    
    Convenience method that unwraps the data.
    
    Args:
        business_id: Business UUID or string
    
    Returns:
        Yelp data dict or None
    """
    try:
        doc = await get_business_scraped_data(business_id)
        if not doc:
            return None
        
        yelp_data = doc.get("yelp_data")
        if not yelp_data:
            return None
        
        # Handle wrapped format
        if isinstance(yelp_data, dict) and "value" in yelp_data:
            return yelp_data.get("value")
        
        # Handle legacy direct format
        return yelp_data
    except Exception as e:
        logger.error(f"Error retrieving Yelp data for business {business_id}: {str(e)}")
        return None