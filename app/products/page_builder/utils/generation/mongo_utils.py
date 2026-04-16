"""
MongoDB utility functions for common database operations.
Provides reusable low-level MongoDB operations.
"""
import logging
from typing import Optional, Dict, Any, List

from app.core.db_mongo import get_mongo_collection

logger = logging.getLogger(__name__)


async def read_from_collection(
    collection_name: str,
    filter_dict: Dict[str, Any],
    db_name: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Read a single document from MongoDB collection.
    
    Args:
        collection_name: Name of the collection
        filter_dict: Filter criteria (e.g., {"business_id": "123"})
        db_name: Database name (defaults to config.mongodb_database)
    
    Returns:
        Document dict if found, None otherwise
    
    Usage:
        doc = await read_from_collection('business_scraped_data', {'business_id': '123'})
    """
    try:
        collection = await get_mongo_collection(collection_name, db_name)
        result = await collection.find_one(filter_dict)
        return result
    except Exception as e:
        logger.error(f"Error reading from collection {collection_name}: {str(e)}")
        raise


async def read_many_from_collection(
    collection_name: str,
    filter_dict: Optional[Dict[str, Any]] = None,
    db_name: Optional[str] = None,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Read multiple documents from MongoDB collection.
    
    Args:
        collection_name: Name of the collection
        filter_dict: Filter criteria (None for all documents)
        db_name: Database name (defaults to config.mongodb_database)
        limit: Maximum number of documents to return
    
    Returns:
        List of document dicts
    
    Usage:
        docs = await read_many_from_collection('business_scraped_data', {'business_id': '123'})
    """
    try:
        collection = await get_mongo_collection(collection_name, db_name)
        cursor = collection.find(filter_dict or {})
        if limit:
            cursor = cursor.limit(limit)
        results = await cursor.to_list(length=limit or 1000)
        return results
    except Exception as e:
        logger.error(f"Error reading many from collection {collection_name}: {str(e)}")
        raise


async def insert_into_collection(
    collection_name: str,
    document: Dict[str, Any],
    db_name: Optional[str] = None
) -> str:
    """
    Insert a new document into MongoDB collection.
    
    Args:
        collection_name: Name of the collection
        document: Document to insert
        db_name: Database name (defaults to config.mongodb_database)
    
    Returns:
        Inserted document _id as string
    
    Usage:
        doc_id = await insert_into_collection('business_scraped_data', {'business_id': '123', ...})
    """
    try:
        collection = await get_mongo_collection(collection_name, db_name)
        result = await collection.insert_one(document)
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error inserting into collection {collection_name}: {str(e)}")
        raise


async def upsert_into_collection(
    collection_name: str,
    filter_dict: Dict[str, Any],
    update_dict: Dict[str, Any],
    db_name: Optional[str] = None
) -> Optional[str]:
    """
    Upsert (update or insert) a document in MongoDB collection.
    
    Args:
        collection_name: Name of the collection
        filter_dict: Filter criteria to find existing document
        update_dict: Data to update/insert (will be wrapped in $set)
        db_name: Database name (defaults to config.mongodb_database)
    
    Returns:
        Document _id as string (existing or newly created)
    
    Usage:
        doc_id = await upsert_into_collection(
            'business_scraped_data',
            {'business_id': '123'},
            {'google_maps_data': {...}}
        )
    """
    try:
        collection = await get_mongo_collection(collection_name, db_name)
        result = await collection.update_one(
            filter_dict,
            {"$set": update_dict},
            upsert=True
        )
        # If upserted, get the document to return _id
        if result.upserted_id:
            return str(result.upserted_id)
        # If updated, fetch the document to return _id
        doc = await collection.find_one(filter_dict)
        return str(doc["_id"]) if doc else None
    except Exception as e:
        logger.error(f"Error upserting into collection {collection_name}: {str(e)}")
        raise

