"""
MongoDB database configuration with automatic environment loading.
"""
import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import config

logger = logging.getLogger(__name__)

# MongoDB client (lazy initialization - created on first use)
_mongo_client: Optional[AsyncIOMotorClient] = None

def get_mongo_client() -> AsyncIOMotorClient:
    """
    Get MongoDB client (singleton pattern, lazy initialization).
    
    The client is created on first use (lazy), unlike PostgreSQL engine which is
    created at module import time. Both patterns work correctly - connections
    are created lazily when first used.
    
    Connection pool settings are optimized for async workloads:
    - Local dev: Lower minPoolSize (2) to reduce idle connections
    - Production: Higher maxPoolSize (50) for concurrent workflows
    
    Returns:
        AsyncIOMotorClient: MongoDB async client instance
    """
    global _mongo_client
    if _mongo_client is None:
        uri = config.mongodb_connection_url
        
        # Adjust pool size based on environment
        # Lower minPoolSize for local dev (reduces idle connections)
        # Higher maxPoolSize for production (handles concurrent workflows)
        is_local = config.is_development()
        min_pool_size = 2 if is_local else 5
        max_pool_size = 50  # Reasonable for async workloads
        
        _mongo_client = AsyncIOMotorClient(
            uri,
            maxPoolSize=max_pool_size,
            minPoolSize=min_pool_size,
            maxIdleTimeMS=45000,  # Close connections idle for 45 seconds
            serverSelectionTimeoutMS=5000,  # Timeout for server selection
            connectTimeoutMS=10000,  # Timeout for initial connection
        )
        
        logger.info(
            f"MongoDB client created: maxPoolSize={max_pool_size}, "
            f"minPoolSize={min_pool_size}, environment={'local' if is_local else 'production'}"
        )
    return _mongo_client


async def get_mongo_database(db_name: Optional[str] = None):
    """
    Get MongoDB database connection (async).
    Args:
        db_name: Database name (defaults to config.mongodb_database)
    Returns:
        Database instance from MongoDB client
    Usage:
        db = await get_mongo_database()
        collection = db['business_scraped_data']
    """
    client = get_mongo_client()
    db_name = db_name or config.mongodb_database
    return client[db_name]


async def get_mongo_collection(collection_name: str, db_name: Optional[str] = None):
    """
    Get MongoDB collection (async).
    Args:
        collection_name: Name of the collection
        db_name: Database name (defaults to config.mongodb_database)
    Returns:
        Collection instance
    Usage:
        collection = await get_mongo_collection('business_scraped_data')
        await collection.insert_one({...})
    """
    db = await get_mongo_database(db_name)
    return db[collection_name]
