"""
Helper functions for user-related operations.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from fastapi import HTTPException

from app.shared.models import BusinessUser
from app.shared.schemas.auth.auth import CurrentUserResponse


async def get_business_id_from_user(
    current_user: CurrentUserResponse,
    db: AsyncSession
) -> uuid.UUID:
    """
    Get business_id for the current user.
    
    Tries:
    1. current_user.business_id (direct)
    2. BusinessUser table lookup (fallback)
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        business_id UUID
        
    Raises:
        HTTPException: If no business found
    """
    business_id = current_user.business_id
    
    if not business_id:
        # Fallback: Query BusinessUser table
        result = await db.execute(
            select(BusinessUser.business_id).where(
                BusinessUser.user_id == current_user.user_id
            ).limit(1)
        )
        business_id = result.scalar_one_or_none()
    
    if not business_id:
        raise HTTPException(
            status_code=400,
            detail="User does not have an associated business. Please complete business setup."
        )
    
    return business_id